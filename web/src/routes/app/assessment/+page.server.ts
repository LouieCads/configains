import { fail, redirect } from '@sveltejs/kit';
import { validateAssessment } from '$lib/coaching/assessment';
import { configuredSelector } from '$lib/server/ai/config';
import { requireClient } from '$lib/server/auth/client';
import { requireSameOrigin } from '$lib/server/auth/origin';
import { runAiMatching } from '$lib/server/coaching/ai';
import { createServiceClient } from '$lib/server/supabase-admin';
import type { Actions, PageServerLoad } from './$types';

// Stops a client from running up model calls by resubmitting.
const dailyLimit = 3;

// Statuses where the answers are already in and Cash or the matcher is acting on them.
const inProgress = ['submitted', 'needs_human_review', 'human_assigned'];

export const load: PageServerLoad = async (event) => {
	const { user } = await requireClient(event);
	const [{ data: active }, { data: latest }] = await Promise.all([
		event.locals.supabase
			.from('client_programs')
			.select('id')
			.eq('client_id', user.id)
			.eq('status', 'active')
			.maybeSingle(),
		event.locals.supabase
			.from('assessments')
			.select('status')
			.eq('client_id', user.id)
			.order('created_at', { ascending: false })
			.limit(1)
			.maybeSingle()
	]);
	// Nothing left to answer: a client with a program, or answers already under review, goes back to
	// their plan, where the recommendation or the review status is shown.
	if (active || inProgress.includes(latest?.status as string)) redirect(303, '/app');
	return {};
};

export const actions = {
	default: async (event) => {
		requireSameOrigin(event);
		const { user } = await requireClient(event);
		const form = await event.request.formData();

		const result = validateAssessment({
			goal: form.get('goal'),
			experience: form.get('experience'),
			training_location: form.get('training_location'),
			days_per_week: form.get('days_per_week'),
			sex: form.get('sex'),
			health: form.getAll('health')
		});
		if (!result.ok) return fail(400, { message: result.message });

		const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
		const { count, error: countError } = await event.locals.supabase
			.from('assessments')
			.select('id', { count: 'exact', head: true })
			.eq('client_id', user.id)
			.gte('created_at', since);
		if (countError) return fail(500, { message: 'Your answers could not be saved. Try again.' });
		if ((count ?? 0) >= dailyLimit)
			return fail(429, {
				message: "You have reached today's limit for assessments. Try again tomorrow."
			});

		const { data: created, error } = await event.locals.supabase
			.from('assessments')
			.insert({
				client_id: user.id,
				answers: result.value,
				red_flags: result.redFlags,
				status: 'submitted'
			})
			.select('id')
			.single();
		if (error || !created)
			return fail(500, { message: 'Your answers could not be saved. Try again.' });

		// If matching fails, the answers stay "submitted" and Cash reviews them from the admin screen.
		try {
			const selected = configuredSelector();
			await runAiMatching({
				session: event.locals.supabase,
				admin: createServiceClient(),
				clientId: user.id,
				assessmentId: created.id,
				selector: selected?.selector ?? null,
				modelName: selected?.model ?? 'rules'
			});
		} catch (matchError) {
			console.error('AI matching failed', matchError);
		}
		redirect(303, '/app');
	}
} satisfies Actions;

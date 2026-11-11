import { fail } from '@sveltejs/kit';
import { recommendedPrograms } from '$lib/coaching/matching';
import { isUuid } from '$lib/coaching/text';
import { requireAdmin } from '$lib/server/auth/admin';
import { requireSameOrigin } from '$lib/server/auth/origin';
import {
	assignProgram,
	explanationOf,
	listAssignable,
	markAssessmentsReviewed
} from '$lib/server/coaching/templates';
import type { Actions, PageServerLoad } from './$types';

type Client = { display_name: string | null; coaching_mode: string } | null;

export const load: PageServerLoad = async (event) => {
	const empty = {
		assessments: [],
		workoutTemplates: [],
		nutritionTemplates: [],
		loadError: null
	};
	if (event.locals.localAdminDemo) {
		await requireAdmin(event);
		return empty;
	}

	// Queries run alongside the admin check; RLS still limits what a non-admin could read,
	// and a failed check discards the results.
	const supabase = event.locals.supabase;
	const [, { data: assessments, error }, templates] = await Promise.all([
		requireAdmin(event),
		supabase
			.from('assessments')
			.select(
				'id, client_id, status, red_flags, answers, created_at, client_profiles(display_name, coaching_mode), ai_recommendations(explanation)'
			)
			.order('created_at', { ascending: false })
			.limit(100),
		listAssignable(supabase)
	]);
	if (error) return { ...empty, loadError: 'Assessments could not be loaded. Please try again.' };

	return {
		assessments: (assessments ?? []).map(({ client_profiles, ai_recommendations, ...row }) => ({
			...row,
			answers: (row.answers ?? {}) as Record<string, unknown>,
			red_flags: (row.red_flags ?? []) as string[],
			client: (Array.isArray(client_profiles) ? client_profiles[0] : client_profiles) as Client,
			explanation: explanationOf(ai_recommendations),
			recommended: recommendedPrograms(row.answers, templates)
		})),
		workoutTemplates: templates.filter((template) => template.kind === 'workout'),
		nutritionTemplates: templates.filter((template) => template.kind === 'nutrition'),
		loadError: null
	};
};

const clientFrom = (form: FormData) => {
	const id = String(form.get('client_id') ?? '');
	return isUuid(id) ? id : null;
};

export const actions = {
	assign: async (event) => {
		requireSameOrigin(event);
		await requireAdmin(event);
		const form = await event.request.formData();
		const clientId = clientFrom(form);
		const workoutId = String(form.get('workout_template_id') ?? '');
		const nutritionId = String(form.get('nutrition_template_id') ?? '') || null;
		if (!clientId || !workoutId)
			return fail(400, { message: 'Choose a workout template to assign.' });

		// The database ends any active program, including an AI one, and records this as a coach assignment.
		const result = await assignProgram(event.locals.supabase, clientId, workoutId, nutritionId);
		if (!result.ok) return fail(400, { message: result.message });
		await markAssessmentsReviewed(event.locals.supabase, clientId);
		return { updated: 'Program assigned.' };
	},
	human: async (event) => {
		requireSameOrigin(event);
		await requireAdmin(event);
		const clientId = clientFrom(await event.request.formData());
		if (!clientId) return fail(400, { message: 'The client could not be found.' });

		const { error: modeError } = await event.locals.supabase
			.from('client_profiles')
			.update({ coaching_mode: 'human' })
			.eq('id', clientId);
		if (modeError) return fail(400, { message: 'The client could not be switched. Try again.' });
		await markAssessmentsReviewed(event.locals.supabase, clientId);
		return { updated: 'Moved to human coaching.' };
	},
	review: async (event) => {
		requireSameOrigin(event);
		await requireAdmin(event);
		const clientId = clientFrom(await event.request.formData());
		if (!clientId) return fail(400, { message: 'The client could not be found.' });
		if (!(await markAssessmentsReviewed(event.locals.supabase, clientId)))
			return fail(400, { message: 'The assessment could not be updated. Try again.' });
		return { updated: 'Marked as reviewed.' };
	}
} satisfies Actions;

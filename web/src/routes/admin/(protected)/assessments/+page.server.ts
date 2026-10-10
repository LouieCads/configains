import { fail } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth/admin';
import { requireSameOrigin } from '$lib/server/auth/origin';
import { assignProgram } from '$lib/server/coaching/templates';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	await requireAdmin(event);
	const empty = { assessments: [], templates: [], loadError: null };
	if (event.locals.localAdminDemo) return empty;

	const { data: assessments, error } = await event.locals.supabase
		.from('assessments')
		.select(
			'id, client_id, status, red_flags, answers, created_at, client_profiles(display_name, coaching_mode)'
		)
		.order('created_at', { ascending: false })
		.limit(100);
	if (error) return { ...empty, loadError: 'Assessments could not be loaded. Please try again.' };

	const ids = (assessments ?? []).map((row) => row.id);
	const { data: recommendations } = ids.length
		? await event.locals.supabase
				.from('ai_recommendations')
				.select('assessment_id, explanation, model')
				.in('assessment_id', ids)
		: { data: [] };
	const byAssessment = new Map((recommendations ?? []).map((row) => [row.assessment_id, row]));

	const { data: templates } = await event.locals.supabase
		.from('program_templates')
		.select('id, kind, name')
		.eq('is_archived', false)
		.is('owner_client_id', null)
		.order('name');
	const active = templates ?? [];

	return {
		assessments: (assessments ?? []).map((row) => ({
			...row,
			client: (Array.isArray(row.client_profiles)
				? row.client_profiles[0]
				: row.client_profiles) as {
				display_name: string | null;
				coaching_mode: string;
			} | null,
			recommendation: byAssessment.get(row.id) ?? null
		})),
		workoutTemplates: active.filter((template) => template.kind === 'workout'),
		nutritionTemplates: active.filter((template) => template.kind === 'nutrition'),
		loadError: null
	};
};

export const actions = {
	assign: async (event) => {
		requireSameOrigin(event);
		await requireAdmin(event);
		const form = await event.request.formData();
		const clientId = String(form.get('client_id') ?? '');
		const workoutId = String(form.get('workout_template_id') ?? '');
		const nutritionId = String(form.get('nutrition_template_id') ?? '') || null;
		if (!clientId || !workoutId)
			return fail(400, { message: 'Choose a workout template to assign.' });

		// The database ends any active program, including an AI one, and records this as a coach assignment.
		const result = await assignProgram(event.locals.supabase, clientId, workoutId, nutritionId);
		if (!result.ok) return fail(400, { message: result.message });
		return { updated: true };
	},
	human: async (event) => {
		requireSameOrigin(event);
		await requireAdmin(event);
		const form = await event.request.formData();
		const clientId = String(form.get('client_id') ?? '');
		const assessmentId = String(form.get('assessment_id') ?? '');
		if (!clientId || !assessmentId) return fail(400, { message: 'The client could not be found.' });

		const { error: modeError } = await event.locals.supabase
			.from('client_profiles')
			.update({ coaching_mode: 'human' })
			.eq('id', clientId);
		if (modeError) return fail(400, { message: 'The client could not be switched. Try again.' });

		const { error: statusError } = await event.locals.supabase
			.from('assessments')
			.update({ status: 'human_assigned' })
			.eq('id', assessmentId);
		if (statusError)
			return fail(400, { message: 'The assessment could not be updated. Try again.' });
		return { updated: true };
	}
} satisfies Actions;

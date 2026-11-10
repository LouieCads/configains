import { fail, redirect } from '@sveltejs/kit';
import { isUuid } from '$lib/coaching/text';
import { requireAdmin } from '$lib/server/auth/admin';
import { requireSameOrigin } from '$lib/server/auth/origin';
import {
	assignProgram,
	listTemplates,
	loadTemplate,
	markAssessmentsReviewed,
	saveTemplate
} from '$lib/server/coaching/templates';
import type { Actions, PageServerLoad } from './$types';

type ClientOption = {
	id: string;
	name: string;
	/** The client's current workout and nutrition, shown in the assign dialog. */
	workout: string | null;
	nutritionId: string | null;
};

export const load: PageServerLoad = async (event) => {
	const empty = { templates: [], clients: [] as ClientOption[], usage: {}, loadError: null };
	if (event.locals.localAdminDemo) {
		await requireAdmin(event);
		return empty;
	}
	const supabase = event.locals.supabase;

	// Queries run alongside the admin check; RLS still limits what a non-admin could read,
	// and a failed check discards the results. Extras (usage, assign dialog) may be blank.
	const [, templatesResult, clients, programs] = await Promise.all([
		requireAdmin(event),
		listTemplates(supabase).then(
			(templates) => ({ templates }),
			() => null
		),
		supabase.from('client_profiles').select('id, display_name').order('display_name'),
		supabase
			.from('client_programs')
			.select(
				'client_id, workout_template_id, nutrition_template_id, workout:program_templates!workout_template_id(name)'
			)
			.eq('status', 'active')
	]);
	if (!templatesResult)
		return { ...empty, loadError: 'Templates could not be loaded. Please try again.' };
	const { templates } = templatesResult;

	const usage: Record<string, number> = {};
	const programOf = new Map<string, { workout: string | null; nutritionId: string | null }>();
	for (const row of programs.data ?? []) {
		for (const id of [row.workout_template_id, row.nutrition_template_id])
			if (id) usage[id] = (usage[id] ?? 0) + 1;
		const workout = row.workout as { name?: string } | { name?: string }[] | null;
		programOf.set(row.client_id as string, {
			workout: (Array.isArray(workout) ? workout[0]?.name : workout?.name) ?? null,
			nutritionId: (row.nutrition_template_id as string | null) ?? null
		});
	}

	return {
		templates,
		usage,
		clients: (clients.data ?? []).map((client): ClientOption => ({
			id: client.id,
			name: client.display_name ?? 'Unnamed client',
			workout: programOf.get(client.id)?.workout ?? null,
			nutritionId: programOf.get(client.id)?.nutritionId ?? null
		})),
		loadError: null
	};
};

export const actions = {
	duplicate: async (event) => {
		requireSameOrigin(event);
		await requireAdmin(event);
		const id = String((await event.request.formData()).get('id') ?? '');
		const source = await loadTemplate(event.locals.supabase, id);
		if (!source) return fail(404, { message: 'That template no longer exists.' });

		// A copy gets new row ids, so editing it never touches the original.
		const copy = {
			...source,
			id: undefined,
			name: `${source.name} (copy)`.slice(0, 120),
			is_archived: false,
			phases: source.phases.map((phase) => ({
				...phase,
				id: undefined,
				exercises: phase.exercises.map((exercise) => ({ ...exercise, id: undefined }))
			}))
		};
		const result = await saveTemplate(event.locals.supabase, copy);
		if (!result.ok) return fail(400, { message: result.message });
		redirect(303, `/admin/templates/${result.id}`);
	},
	archive: async (event) => {
		requireSameOrigin(event);
		await requireAdmin(event);
		const form = await event.request.formData();
		const id = String(form.get('id') ?? '');
		const archived = form.get('archived') === 'true';
		const { error } = await event.locals.supabase
			.from('program_templates')
			.update({ is_archived: archived })
			.eq('id', id);
		if (error) return fail(400, { message: 'The template could not be updated. Try again.' });
		return { updated: archived ? 'Template archived.' : 'Template restored.' };
	},
	assign: async (event) => {
		requireSameOrigin(event);
		await requireAdmin(event);
		const form = await event.request.formData();
		const clientId = String(form.get('client_id') ?? '');
		const workoutId = String(form.get('workout_template_id') ?? '');
		let nutritionId: string | null = String(form.get('nutrition_template_id') ?? '') || null;
		if (!isUuid(clientId) || !isUuid(workoutId))
			return fail(400, { message: 'Choose a client to assign this template to.' });

		// "Keep" carries over the client's current nutrition plan.
		if (nutritionId === 'keep') {
			const { data } = await event.locals.supabase
				.from('client_programs')
				.select('nutrition_template_id')
				.eq('client_id', clientId)
				.eq('status', 'active')
				.maybeSingle();
			nutritionId = (data?.nutrition_template_id as string | null) ?? null;
		}

		const result = await assignProgram(event.locals.supabase, clientId, workoutId, nutritionId);
		if (!result.ok) return fail(400, { message: result.message });
		await markAssessmentsReviewed(event.locals.supabase, clientId);
		return { updated: 'Program assigned.', assignedClient: clientId };
	}
} satisfies Actions;

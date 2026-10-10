import { fail, redirect } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth/admin';
import { requireSameOrigin } from '$lib/server/auth/origin';
import { listTemplates, loadTemplate, saveTemplate } from '$lib/server/coaching/templates';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	await requireAdmin(event);
	if (event.locals.localAdminDemo) return { templates: [], loadError: null };
	try {
		return { templates: await listTemplates(event.locals.supabase), loadError: null };
	} catch {
		return { templates: [], loadError: 'Templates could not be loaded. Please try again.' };
	}
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
		return { updated: true };
	}
} satisfies Actions;

import { error, fail, redirect } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth/admin';
import { requireSameOrigin } from '$lib/server/auth/origin';
import { validateTemplate, type TemplateInput, type TemplateKind } from '$lib/coaching/template';
import { loadTemplate, saveTemplate } from '$lib/server/coaching/templates';
import type { Actions, PageServerLoad } from './$types';

// Keeps a failed save's edits on screen, but only when the draft has the right outer shape.
function draftFrom(raw: unknown): TemplateInput | undefined {
	if (!raw || typeof raw !== 'object' || !Array.isArray((raw as { phases?: unknown }).phases))
		return undefined;
	return raw as TemplateInput;
}

const blankTemplate = (kind: TemplateKind): TemplateInput => ({
	kind,
	goal: 'fat_loss',
	name: '',
	description: null,
	is_archived: false,
	rules: {},
	phases: [{ name: 'Phase 1', instructions: null, exercises: [] }]
});

export const load: PageServerLoad = async (event) => {
	const { id } = event.params;
	if (id === 'new') {
		await requireAdmin(event);
		const kind = event.url.searchParams.get('kind') === 'nutrition' ? 'nutrition' : 'workout';
		return { template: blankTemplate(kind), isNew: true, saved: false, owner: null };
	}

	// Queries run alongside the admin check; RLS still limits what a non-admin could read,
	// and a failed check discards the results.
	const [, template, { data: ownership }] = await Promise.all([
		requireAdmin(event),
		loadTemplate(event.locals.supabase, id),
		// A client's customised copy links back to that client instead of the library.
		event.locals.supabase
			.from('program_templates')
			.select('owner:client_profiles!owner_client_id(id, display_name)')
			.eq('id', id)
			.maybeSingle()
	]);
	if (!template) error(404, 'Template not found.');
	const raw = ownership?.owner as
		| { id: string; display_name: string | null }
		| { id: string; display_name: string | null }[]
		| null
		| undefined;
	const owner = (Array.isArray(raw) ? raw[0] : raw) ?? null;

	return {
		template,
		isNew: false,
		saved: event.url.searchParams.get('saved') === '1',
		owner: owner ? { id: owner.id, name: owner.display_name ?? 'this client' } : null
	};
};

export const actions = {
	save: async (event) => {
		requireSameOrigin(event);
		await requireAdmin(event);
		const form = await event.request.formData();
		const payload = String(form.get('payload') ?? '');

		let raw: unknown;
		try {
			raw = JSON.parse(payload);
		} catch {
			return fail(400, {
				message: 'The editor data could not be read. Reload and try again.',
				draft: undefined
			});
		}

		const checked = validateTemplate(raw);
		if (!checked.ok) return fail(400, { message: checked.message, draft: draftFrom(raw) });

		const result = await saveTemplate(event.locals.supabase, checked.value);
		if (!result.ok) return fail(400, { message: result.message, draft: draftFrom(raw) });

		redirect(303, `/admin/templates/${result.id}?saved=1`);
	}
} satisfies Actions;

import { error, fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth/admin';
import { requireSameOrigin } from '$lib/server/auth/origin';
import {
	asLibraryTemplate,
	validateTemplate,
	type TemplateInput,
	type TemplateKind
} from '$lib/coaching/template';
import { loadTemplate, saveTemplate } from '$lib/server/coaching/templates';
import { listLibraryNames } from '$lib/server/coaching/exercises';
import { cleanText, isUuid } from '$lib/coaching/text';
import type { Actions, PageServerLoad } from './$types';

// Keeps a failed save's edits on screen, but only when the draft has the right outer shape.
function draftFrom(raw: unknown): TemplateInput | undefined {
	if (!raw || typeof raw !== 'object' || !Array.isArray((raw as { phases?: unknown }).phases))
		return undefined;
	return raw as TemplateInput;
}

/** Reads and checks the editor's JSON payload. */
async function readPayload(event: RequestEvent) {
	const form = await event.request.formData();
	let raw: unknown;
	try {
		raw = JSON.parse(String(form.get('payload') ?? ''));
	} catch {
		return {
			form,
			failure: fail(400, {
				message: 'The editor data could not be read. Reload and try again.',
				draft: undefined
			})
		};
	}
	const checked = validateTemplate(raw);
	if (!checked.ok)
		return { form, failure: fail(400, { message: checked.message, draft: draftFrom(raw) }) };
	return { form, template: checked.value, raw };
}

const blankTemplate = (kind: TemplateKind): TemplateInput => ({
	kind,
	goal: 'fat_loss',
	name: '',
	description: null,
	is_archived: false,
	rules: {},
	phases: [{ name: 'Phase 1', instructions: null, duration_weeks: null, exercises: [] }]
});

export const load: PageServerLoad = async (event) => {
	const { id } = event.params;
	if (id === 'new') {
		const [, libraryNames] = await Promise.all([
			requireAdmin(event),
			listLibraryNames(event.locals.supabase)
		]);
		const kind = event.url.searchParams.get('kind') === 'nutrition' ? 'nutrition' : 'workout';
		return {
			template: blankTemplate(kind),
			isNew: true,
			saved: false,
			owner: null,
			libraryId: null,
			libraryNames
		};
	}

	// Queries run alongside the admin check; RLS still limits what a non-admin could read,
	// and a failed check discards the results.
	const [, template, { data: ownership }, libraryNames] = await Promise.all([
		requireAdmin(event),
		loadTemplate(event.locals.supabase, id),
		// A client's customised copy links back to that client instead of the library.
		event.locals.supabase
			.from('program_templates')
			.select('owner:client_profiles!owner_client_id(id, display_name)')
			.eq('id', id)
			.maybeSingle(),
		listLibraryNames(event.locals.supabase)
	]);
	if (!template) error(404, 'Template not found.');
	const library = event.url.searchParams.get('library');
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
		libraryId: isUuid(library) ? library : null,
		libraryNames,
		owner: owner ? { id: owner.id, name: owner.display_name ?? 'this client' } : null
	};
};

export const actions = {
	save: async (event) => {
		requireSameOrigin(event);
		await requireAdmin(event);
		const read = await readPayload(event);
		if (read.failure) return read.failure;

		const result = await saveTemplate(event.locals.supabase, read.template);
		if (!result.ok) return fail(400, { message: result.message, draft: draftFrom(read.raw) });

		redirect(303, `/admin/templates/${result.id}?saved=1`);
	},

	/** Client copies: saves the client's program, then adds the same program to the library. */
	saveAsTemplate: async (event) => {
		requireSameOrigin(event);
		await requireAdmin(event);
		const read = await readPayload(event);
		if (read.failure) return read.failure;
		const draft = draftFrom(read.raw);
		const name = cleanText(read.form.get('library_name'), 120);
		if (!name) return fail(400, { message: 'Name the new library template.', draft });
		if (read.template.id !== event.params.id)
			return fail(400, { message: 'Save this program first.', draft });

		const { data: copy } = await event.locals.supabase
			.from('program_templates')
			.select('owner_client_id')
			.eq('id', event.params.id)
			.maybeSingle();
		if (!copy?.owner_client_id)
			return fail(400, { message: "Only a client's program can be saved as a template.", draft });

		const saved = await saveTemplate(event.locals.supabase, read.template);
		if (!saved.ok) return fail(400, { message: saved.message, draft });
		const library = await saveTemplate(
			event.locals.supabase,
			asLibraryTemplate(read.template, name)
		);
		if (!library.ok)
			return fail(400, {
				message: `Saved for this client, but the library template could not be created. ${library.message}`
			});

		redirect(303, `/admin/templates/${saved.id}?saved=1&library=${library.id}`);
	}
} satisfies Actions;

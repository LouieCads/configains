/**
 * Website document API used by the admin content editor.
 *
 * GET  loads the editable draft (or published content when no draft exists).
 * PUT  validates and saves the draft.
 * POST publishes the saved draft.
 *
 * Writes pass the revision the editor last saw. The database functions reject
 * stale revisions with SQLSTATE 40001, returned here as 409 so one session
 * never silently overwrites another.
 */
import { json } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth/admin';
import { requireSameOrigin } from '$lib/server/auth/origin';
import { readJsonObject } from '$lib/server/request';
import { readEditableWebsite, readWebsite } from '$lib/server/website';
import {
	normalizeContent,
	validateWebsite,
	websiteSchema,
	type Content
} from '$lib/content/schema';

const STALE_REVISION = '40001';

/** Maps a failed RPC to a 409 for stale revisions or a 503 otherwise. */
function rpcFailure(code: string | undefined, staleMessage: string, failureMessage: string) {
	const stale = code === STALE_REVISION;
	return json({ message: stale ? staleMessage : failureMessage }, { status: stale ? 409 : 503 });
}

export const GET = async (event) => {
	await requireAdmin(event);
	const { unavailable, ...website } = await readEditableWebsite(event.locals.supabase);
	if (unavailable)
		return json(
			{ message: 'Website content could not be loaded. Please try again.' },
			{ status: 503 }
		);
	return json(website);
};

export const PUT = async (event) => {
	requireSameOrigin(event);
	await requireAdmin(event);
	const body = await readJsonObject(event.request);
	const errors = validateWebsite((body.content ?? {}) as Content);
	if (errors.length) return json({ message: errors[0], errors }, { status: 400 });
	const content = normalizeContent(websiteSchema, body.content) as Content;
	const { data, error } = await event.locals.supabase.rpc('save_website_draft', {
		content,
		expected_revision: body.revision ?? null
	});
	if (error)
		return rpcFailure(
			error.code,
			'Another session changed this draft. Reload before saving again.',
			'The draft could not be saved. Confirm the CMS migration has been applied, then try again.'
		);
	return json({ revision: data });
};

export const POST = async (event) => {
	requireSameOrigin(event);
	await requireAdmin(event);
	const body = await readJsonObject(event.request, 'Invalid publish request.');
	if (typeof body.revision !== 'string')
		return json({ message: 'Invalid publish request.' }, { status: 400 });
	const draft = await readWebsite(event.locals.supabase, true);
	if (draft.error) return json({ message: 'The draft could not be loaded.' }, { status: 503 });
	if (!draft.revision) return json({ message: 'Save a draft before publishing.' }, { status: 400 });
	// Re-validate in case the stored draft predates a stricter rule.
	const errors = validateWebsite(draft.content);
	if (errors.length) return json({ message: errors[0], errors }, { status: 400 });
	const { data, error } = await event.locals.supabase.rpc('publish_website_content', {
		expected_revision: body.revision
	});
	if (error)
		return rpcFailure(
			error.code,
			'This draft changed. Reload and review it before publishing.',
			'Publishing failed. Please try again.'
		);
	return json({ publishedRevision: data });
};

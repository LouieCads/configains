import { json } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth/admin';
import { requireSameOrigin } from '$lib/server/auth/origin';
import { readWebsite } from '$lib/server/website';
import {
	normalizeContent,
	validateWebsite,
	websiteSchema,
	type Content
} from '$lib/content/schema';

export const GET = async (event) => {
	await requireAdmin(event);
	const [draft, published] = await Promise.all([
		readWebsite(event.locals.supabase, true),
		readWebsite(event.locals.supabase)
	]);
	if (draft.error || published.error)
		return json(
			{ message: 'Website content could not be loaded. Please try again.' },
			{ status: 503 }
		);
	return json({
		content: draft.revision ? draft.content : published.content,
		revision: draft.revision,
		publishedRevision: published.revision
	});
};

export const PUT = async (event) => {
	requireSameOrigin(event);
	await requireAdmin(event);
	let body;
	try {
		body = await event.request.json();
	} catch {
		return json({ message: 'Invalid content request.' }, { status: 400 });
	}
	if (!body || typeof body !== 'object' || Array.isArray(body))
		return json({ message: 'Invalid content request.' }, { status: 400 });
	const errors = validateWebsite(body.content ?? {});
	if (errors.length) return json({ message: errors[0], errors }, { status: 400 });
	const content = normalizeContent(websiteSchema, body.content) as Content;
	const { data, error } = await event.locals.supabase.rpc('save_website_draft', {
		content,
		expected_revision: body.revision ?? null
	});
	if (error)
		return json(
			{
				message:
					error.code === '40001'
						? 'Another session changed this draft. Reload before saving again.'
						: 'The draft could not be saved. Confirm the CMS migration has been applied, then try again.'
			},
			{ status: error.code === '40001' ? 409 : 503 }
		);
	return json({ revision: data });
};

export const POST = async (event) => {
	requireSameOrigin(event);
	await requireAdmin(event);
	let body;
	try {
		body = await event.request.json();
	} catch {
		return json({ message: 'Invalid publish request.' }, { status: 400 });
	}
	if (!body || typeof body !== 'object' || Array.isArray(body) || typeof body.revision !== 'string')
		return json({ message: 'Invalid publish request.' }, { status: 400 });
	const draft = await readWebsite(event.locals.supabase, true);
	if (draft.error) return json({ message: 'The draft could not be loaded.' }, { status: 503 });
	if (!draft.revision) return json({ message: 'Save a draft before publishing.' }, { status: 400 });
	const errors = validateWebsite(draft.content);
	if (errors.length) return json({ message: errors[0], errors }, { status: 400 });
	const { data, error } = await event.locals.supabase.rpc('publish_website_content', {
		expected_revision: body.revision
	});
	if (error)
		return json(
			{
				message:
					error.code === '40001'
						? 'This draft changed. Reload and review it before publishing.'
						: 'Publishing failed. Please try again.'
			},
			{ status: error.code === '40001' ? 409 : 503 }
		);
	return json({ publishedRevision: data });
};

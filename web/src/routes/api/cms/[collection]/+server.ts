import { requireAdmin } from '$lib/server/auth/admin';
import { isCmsCollection } from '$lib/utils/cms';
import { error, json } from '@sveltejs/kit';
import { requireSameOrigin } from '$lib/server/auth/origin';
import { isSafeUrl } from '$lib/content/schema';

const fields = {
	site_content: ['key', 'title', 'body', 'metadata'],
	testimonials: ['name', 'role', 'quote', 'image_url', 'image_alt', 'is_published', 'sort_order'],
	transformations: [
		'title',
		'summary',
		'story',
		'before_image_url',
		'after_image_url',
		'before_image_alt',
		'after_image_alt',
		'is_published',
		'sort_order'
	]
} as const;

function collectionOf(value: string | undefined) {
	if (!value || !isCmsCollection(value)) error(404, 'Unknown CMS collection.');
	if (value === 'site_content') error(400, 'Use the website editor to change site content.');
	return value;
}

function allowedPayload(collection: keyof typeof fields, input: Record<string, unknown>) {
	const allowed = fields[collection] as readonly string[];
	const result = Object.fromEntries(Object.entries(input).filter(([key]) => allowed.includes(key)));
	for (const [key, value] of Object.entries(result)) {
		if (key === 'is_published') {
			if (typeof value !== 'boolean') error(400, 'Publication status must be on or off.');
		} else if (key === 'sort_order') {
			if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > 10000)
				error(400, 'Use a sort order between 0 and 10000.');
		} else if (typeof value !== 'string' || value.length > 12000)
			error(400, 'Content is invalid or too long.');
		if (key.endsWith('_url') && value && (typeof value !== 'string' || !isSafeUrl(value)))
			error(400, 'Image addresses must use HTTPS or a local path.');
	}
	const required = collection === 'testimonials' ? ['name', 'quote'] : ['title'];
	if (required.some((key) => typeof result[key] !== 'string' || !String(result[key]).trim()))
		error(400, 'Please fill in the required title or client name and quote.');
	return result;
}

async function requestBody(request: Request): Promise<Record<string, unknown>> {
	let body;
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid content request.');
	}
	if (!body || typeof body !== 'object' || Array.isArray(body))
		error(400, 'Invalid content request.');
	return body;
}

export const GET = async (event) => {
	await requireAdmin(event);
	const collection = collectionOf(event.params.collection);
	const { data, error: queryError } = await event.locals.supabase
		.from(collection)
		.select('*')
		.order('created_at', { ascending: false });
	if (queryError) error(400, queryError.message);
	return json(data);
};

export const POST = async (event) => {
	requireSameOrigin(event);
	await requireAdmin(event);
	const collection = collectionOf(event.params.collection);
	const input = allowedPayload(collection, await requestBody(event.request));
	const { data, error: queryError } = await event.locals.supabase
		.from(collection)
		.insert(input)
		.select()
		.single();
	if (queryError) return json({ message: queryError.message }, { status: 400 });
	return json(data, { status: 201 });
};

export const PATCH = async (event) => {
	requireSameOrigin(event);
	await requireAdmin(event);
	const collection = collectionOf(event.params.collection);
	const body = await requestBody(event.request);
	const id = String(body.id ?? '');
	if (!id) return json({ message: 'An item id is required.' }, { status: 400 });
	const { data, error: queryError } = await event.locals.supabase
		.from(collection)
		.update(allowedPayload(collection, body))
		.eq('id', id)
		.select()
		.single();
	if (queryError) return json({ message: queryError.message }, { status: 400 });
	return json(data);
};

export const DELETE = async (event) => {
	requireSameOrigin(event);
	await requireAdmin(event);
	const collection = collectionOf(event.params.collection);
	const id = event.url.searchParams.get('id');
	if (!id) return json({ message: 'An item id is required.' }, { status: 400 });
	const { error: queryError } = await event.locals.supabase.from(collection).delete().eq('id', id);
	if (queryError) return json({ message: queryError.message }, { status: 400 });
	return new Response(null, { status: 204 });
};

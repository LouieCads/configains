import { requireAdmin } from '$lib/server/auth/admin';
import { isCmsCollection } from '$lib/utils/cms';
import { error, json } from '@sveltejs/kit';

const fields = {
	site_content: ['key', 'title', 'body', 'metadata'],
	testimonials: ['name', 'role', 'quote', 'image_url', 'is_published', 'sort_order'],
	transformations: [
		'title',
		'summary',
		'story',
		'before_image_url',
		'after_image_url',
		'is_published',
		'sort_order'
	]
} as const;

function collectionOf(value: string | undefined) {
	if (!value || !isCmsCollection(value)) error(404, 'Unknown CMS collection.');
	return value;
}

function allowedPayload(collection: keyof typeof fields, input: Record<string, unknown>) {
	const allowed = fields[collection] as readonly string[];
	return Object.fromEntries(Object.entries(input).filter(([key]) => allowed.includes(key)));
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
	await requireAdmin(event);
	const collection = collectionOf(event.params.collection);
	const input = allowedPayload(collection, await event.request.json());
	const { data, error: queryError } = await event.locals.supabase
		.from(collection)
		.insert(input)
		.select()
		.single();
	if (queryError) return json({ message: queryError.message }, { status: 400 });
	return json(data, { status: 201 });
};

export const PATCH = async (event) => {
	await requireAdmin(event);
	const collection = collectionOf(event.params.collection);
	const body = (await event.request.json()) as Record<string, unknown>;
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
	await requireAdmin(event);
	const collection = collectionOf(event.params.collection);
	const id = event.url.searchParams.get('id');
	if (!id) return json({ message: 'An item id is required.' }, { status: 400 });
	const { error: queryError } = await event.locals.supabase.from(collection).delete().eq('id', id);
	if (queryError) return json({ message: queryError.message }, { status: 400 });
	return new Response(null, { status: 204 });
};

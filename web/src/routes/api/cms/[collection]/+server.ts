/**
 * CRUD API for item collections (testimonials, transformations).
 *
 * Writable columns and their rules come from `$lib/content/collections`.
 * Row-level security in the database is the final authority; these checks
 * give admins clear messages and keep unexpected columns out.
 */
import { error, json } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth/admin';
import { requireSameOrigin } from '$lib/server/auth/origin';
import { readJsonObject } from '$lib/server/request';
import {
	isCollectionName,
	validateCollectionItem,
	type CollectionName
} from '$lib/content/collections';

function collectionOf(value: string | undefined): CollectionName {
	if (value === 'site_content') error(400, 'Use the website editor to change site content.');
	if (!value || !isCollectionName(value)) error(404, 'Unknown CMS collection.');
	return value;
}

/** Sanitized item values from the request body, or a 400 response. */
function itemValues(collection: CollectionName, body: Record<string, unknown>) {
	const result = validateCollectionItem(collection, body);
	if ('error' in result) error(400, result.error);
	return result.values;
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
	const values = itemValues(collection, await readJsonObject(event.request));
	const { data, error: queryError } = await event.locals.supabase
		.from(collection)
		.insert(values)
		.select()
		.single();
	if (queryError) return json({ message: queryError.message }, { status: 400 });
	return json(data, { status: 201 });
};

export const PATCH = async (event) => {
	requireSameOrigin(event);
	await requireAdmin(event);
	const collection = collectionOf(event.params.collection);
	const body = await readJsonObject(event.request);
	const id = String(body.id ?? '');
	if (!id) return json({ message: 'An item id is required.' }, { status: 400 });
	const { data, error: queryError } = await event.locals.supabase
		.from(collection)
		.update(itemValues(collection, body))
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

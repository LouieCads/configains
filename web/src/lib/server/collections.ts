import { error } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CollectionName, CollectionRow } from '$lib/content/collections';

/** Loads every row of a collection in display order for its admin editor. */
export async function loadCollection(
	supabase: SupabaseClient,
	collection: CollectionName,
	failureMessage: string
): Promise<{ rows: CollectionRow[] }> {
	const { data, error: queryError } = await supabase
		.from(collection)
		.select('*')
		.order('sort_order');
	if (queryError) error(503, failureMessage);
	return { rows: data ?? [] };
}

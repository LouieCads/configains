import { loadCollection } from '$lib/server/collections';

export const load = async ({ locals }) =>
	loadCollection(
		locals.supabase,
		'transformations',
		'Transformations could not be loaded. Please try again.'
	);

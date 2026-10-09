import { loadCollection } from '$lib/server/collections';

export const load = async ({ locals }) =>
	loadCollection(
		locals.supabase,
		'testimonials',
		'Client stories could not be loaded. Please try again.'
	);

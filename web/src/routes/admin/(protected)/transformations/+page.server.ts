import { error } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const { data, error: queryError } = await locals.supabase
		.from('transformations')
		.select('*')
		.order('sort_order');
	if (queryError) error(503, 'Transformations could not be loaded. Please try again.');
	return { rows: data ?? [] };
};

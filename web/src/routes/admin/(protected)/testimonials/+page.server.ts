import { error } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const { data, error: queryError } = await locals.supabase
		.from('testimonials')
		.select('*')
		.order('sort_order');
	if (queryError) error(503, 'Client stories could not be loaded. Please try again.');
	return { rows: data ?? [] };
};

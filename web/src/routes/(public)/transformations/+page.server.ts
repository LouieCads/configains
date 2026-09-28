export const load = async ({ locals }) => {
	const { data } = await locals.supabase
		.from('transformations')
		.select('*')
		.eq('is_published', true)
		.order('sort_order');
	return { transformations: data ?? [] };
};

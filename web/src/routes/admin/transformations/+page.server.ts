export const load = async ({ locals }) => {
	const { data } = await locals.supabase.from('transformations').select('*').order('sort_order');
	return { rows: data ?? [] };
};

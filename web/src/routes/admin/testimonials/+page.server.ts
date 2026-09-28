export const load = async ({ locals }) => {
	const { data } = await locals.supabase.from('testimonials').select('*').order('sort_order');
	return { rows: data ?? [] };
};

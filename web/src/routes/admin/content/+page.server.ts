export const load = async ({ locals }) => {
	const { data } = await locals.supabase.from('site_content').select('*').order('key');
	return { rows: data ?? [] };
};

export const load = async ({ locals }) => {
	const [content, testimonials, transformations] = await Promise.all([
		locals.supabase.from('site_content').select('*', { count: 'exact', head: true }),
		locals.supabase.from('testimonials').select('*', { count: 'exact', head: true }),
		locals.supabase.from('transformations').select('*', { count: 'exact', head: true })
	]);
	return {
		counts: {
			content: content.count ?? 0,
			testimonials: testimonials.count ?? 0,
			transformations: transformations.count ?? 0
		}
	};
};

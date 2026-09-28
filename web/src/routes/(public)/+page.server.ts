export const load = async ({ locals }) => {
	const [testimonials, transformations] = await Promise.all([
		locals.supabase
			.from('testimonials')
			.select('*')
			.eq('is_published', true)
			.order('sort_order')
			.limit(3),
		locals.supabase
			.from('transformations')
			.select('*')
			.eq('is_published', true)
			.order('sort_order')
			.limit(3)
	]);

	return { testimonials: testimonials.data ?? [], transformations: transformations.data ?? [] };
};

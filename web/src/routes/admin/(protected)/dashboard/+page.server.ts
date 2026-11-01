export const load = async ({ locals }) => {
	const supabase = locals.supabase;
	const count = (query: PromiseLike<{ count: number | null }>) =>
		Promise.resolve(query).then(
			(result) => result.count ?? 0,
			() => 0
		);
	const head = { count: 'exact' as const, head: true };

	const [testimonials, transformations] = await Promise.all([
		count(supabase.from('testimonials').select('*', head)),
		count(supabase.from('transformations').select('*', head))
	]);

	// Coaching tables do not exist in the local demo.
	const coaching = locals.localAdminDemo
		? { clients: 0, checkIns: 0, assessments: 0 }
		: await Promise.all([
				count(supabase.from('client_profiles').select('*', head)),
				count(supabase.from('check_ins').select('*', head).is('coach_feedback', null)),
				count(supabase.from('assessments').select('*', head).eq('status', 'needs_human_review'))
			]).then(([clients, checkIns, assessments]) => ({ clients, checkIns, assessments }));

	return { testimonials, transformations, ...coaching, localDemo: locals.localAdminDemo };
};

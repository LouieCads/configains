export const load = async ({ locals }) => {
	const supabase = locals.supabase;
	const count = (query: PromiseLike<{ count: number | null }>) =>
		Promise.resolve(query).then(
			(result) => result.count ?? 0,
			() => 0
		);
	const head = { count: 'exact' as const, head: true };

	// All counts go out at once. Coaching tables do not exist in the local demo.
	const coaching = !locals.localAdminDemo;
	const [testimonials, transformations, clients, checkIns, assessments] = await Promise.all([
		count(supabase.from('testimonials').select('*', head)),
		count(supabase.from('transformations').select('*', head)),
		coaching ? count(supabase.from('client_profiles').select('*', head)) : 0,
		coaching ? count(supabase.from('check_ins').select('*', head).is('coach_feedback', null)) : 0,
		coaching
			? count(supabase.from('assessments').select('*', head).eq('status', 'needs_human_review'))
			: 0
	]);

	return {
		testimonials,
		transformations,
		clients,
		checkIns,
		assessments,
		localDemo: locals.localAdminDemo
	};
};

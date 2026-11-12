import { loadCoachTasks, type CoachTasks } from '$lib/server/coaching/tasks';

const noTasks: CoachTasks = { assessments: [], checkIns: [], messages: [], phases: [] };

export const load = async ({ locals }) => {
	const supabase = locals.supabase;
	const count = (query: PromiseLike<{ count: number | null }>) =>
		Promise.resolve(query).then(
			(result) => result.count ?? 0,
			() => 0
		);
	const head = { count: 'exact' as const, head: true };

	// Everything goes out at once. Coaching tables do not exist in the local demo.
	const coaching = !locals.localAdminDemo;
	const [testimonials, transformations, clients, tasks] = await Promise.all([
		count(supabase.from('testimonials').select('*', head)),
		count(supabase.from('transformations').select('*', head)),
		coaching
			? count(supabase.from('client_profiles').select('*', head).is('archived_at', null))
			: 0,
		coaching ? loadCoachTasks(supabase).catch(() => noTasks) : noTasks
	]);

	return {
		testimonials,
		transformations,
		clients,
		tasks,
		localDemo: locals.localAdminDemo
	};
};

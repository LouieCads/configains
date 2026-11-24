import { loadDashboard } from '$lib/server/coaching/progress';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { client } = await event.parent();
	const today = new Date().toISOString().slice(0, 10);
	return { ...(await loadDashboard(event.locals.supabase, client.id, today)), today };
};

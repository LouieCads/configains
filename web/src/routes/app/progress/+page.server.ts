import { requireClient } from '$lib/server/auth/client';
import { loadProgress } from '$lib/server/coaching/progress';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { user } = await requireClient(event);
	event.setHeaders({ 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' });
	const today = new Date().toISOString().slice(0, 10);
	const progress = await loadProgress(event.locals.supabase, user.id, today);
	return { ...progress, today };
};

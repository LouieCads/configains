import { requireClient } from '$lib/server/auth/client';
import { loadClientHome } from '$lib/server/coaching/client-view';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { user, profile } = await requireClient(event);
	event.setHeaders({ 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' });
	return loadClientHome(event.locals.supabase, user.id, profile);
};

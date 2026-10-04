import { requireAdmin } from '$lib/server/auth/admin';

export const load = async (event) => {
	const { user, profile } = await requireAdmin(event);
	event.setHeaders({ 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' });
	return { user, profile };
};

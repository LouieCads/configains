import { error } from '@sveltejs/kit';
import { isUuid } from '$lib/coaching/text';
import { requireAdmin } from '$lib/server/auth/admin';
import type { LayoutServerLoad } from './$types';

/**
 * The coach's read-only copy of a client's own screens. It loads the same data the client's pages do,
 * for the chosen client, and has no actions, so nothing here can write.
 */
export const load: LayoutServerLoad = async (event) => {
	const clientId = event.params.id;
	if (!isUuid(clientId)) {
		await requireAdmin(event);
		error(404, 'Client not found');
	}
	const [, result] = await Promise.all([
		requireAdmin(event),
		event.locals.supabase
			.from('client_profiles')
			.select('id, display_name, coaching_mode')
			.eq('id', clientId)
			.maybeSingle()
	]);
	if (result.error) error(500, 'The client could not be loaded.');
	if (!result.data) error(404, 'Client not found');
	event.setHeaders({ 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' });
	return { client: result.data, base: `/admin/view/${clientId}` };
};

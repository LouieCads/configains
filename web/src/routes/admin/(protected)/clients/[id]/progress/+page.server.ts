import { error } from '@sveltejs/kit';
import { isUuid } from '$lib/coaching/text';
import { requireAdmin } from '$lib/server/auth/admin';
import { loadDashboard } from '$lib/server/coaching/progress';
import type { PageServerLoad } from './$types';

/** One client's charts, as the client sees them, for the coach. */
export const load: PageServerLoad = async (event) => {
	const clientId = event.params.id;
	if (!isUuid(clientId)) {
		await requireAdmin(event);
		error(404, 'Client not found.');
	}
	const supabase = event.locals.supabase;
	const today = new Date().toISOString().slice(0, 10);
	const [, profileResult, progress] = await Promise.all([
		requireAdmin(event),
		supabase.from('client_profiles').select('id, display_name').eq('id', clientId).maybeSingle(),
		loadDashboard(supabase, clientId, today)
	]);
	if (profileResult.error) error(500, 'The client could not be loaded.');
	if (!profileResult.data) error(404, 'Client not found.');

	return { client: profileResult.data, progress, today };
};

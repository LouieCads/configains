import { loadClientLog } from '$lib/server/coaching/client-view';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { client } = await event.parent();
	return loadClientLog(event.locals.supabase, client.id);
};

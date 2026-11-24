import { redirect } from '@sveltejs/kit';
import { loadClientCoach } from '$lib/server/coaching/client-view';
import type { PageServerLoad } from './$types';

// Same rule as the client's page: the conversation belongs to Human Coaching. Reading it here does not
// mark any message as read.
export const load: PageServerLoad = async (event) => {
	const { client, base } = await event.parent();
	if (client.coaching_mode !== 'human') redirect(303, base);
	return loadClientCoach(event.locals.supabase, client.id, client);
};

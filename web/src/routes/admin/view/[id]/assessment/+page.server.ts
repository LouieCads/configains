import { redirect } from '@sveltejs/kit';
import { assessmentIsDone } from '$lib/server/coaching/client-view';
import type { PageServerLoad } from './$types';

// Same rule as the client's page: once there is a program or answers under review, there is nothing to answer.
export const load: PageServerLoad = async (event) => {
	const { client, base } = await event.parent();
	if (await assessmentIsDone(event.locals.supabase, client.id)) redirect(303, base);
	return {};
};

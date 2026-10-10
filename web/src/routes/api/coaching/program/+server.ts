import { json, type RequestHandler } from '@sveltejs/kit';
import { requireClient } from '$lib/server/auth/client';
import { loadActiveProgram } from '$lib/server/coaching/templates';

/** The client's active program, cached on the device for offline logging. */
export const GET: RequestHandler = async (event) => {
	const { user } = await requireClient(event);
	const program = await loadActiveProgram(event.locals.supabase, user.id);
	return json({ program }, { headers: { 'Cache-Control': 'private, no-store' } });
};

import { json, type RequestHandler } from '@sveltejs/kit';
import { requireClient } from '$lib/server/auth/client';
import { loadTargets } from '$lib/server/coaching/progress';
import { loadActiveProgram } from '$lib/server/coaching/templates';

/** The client's active program and the coach's targets, cached on the device for offline logging. */
export const GET: RequestHandler = async (event) => {
	const { user } = await requireClient(event);
	const [program, targets] = await Promise.all([
		loadActiveProgram(event.locals.supabase, user.id),
		// Targets are a convenience here: if they cannot be read, logging still works without them.
		loadTargets(event.locals.supabase, user.id).catch(() => null)
	]);
	return json({ program, targets }, { headers: { 'Cache-Control': 'private, no-store' } });
};

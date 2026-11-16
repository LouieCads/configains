import { requireClient } from '$lib/server/auth/client';
import { loadWeekSnapshot } from '$lib/server/coaching/progress';
import { loadActiveProgram } from '$lib/server/coaching/templates';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { user, profile } = await requireClient(event);
	event.setHeaders({ 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' });
	const today = new Date().toISOString().slice(0, 10);
	const program = await loadActiveProgram(event.locals.supabase, user.id);

	const { data: latest } = await event.locals.supabase
		.from('assessments')
		.select('status')
		.order('created_at', { ascending: false })
		.limit(1)
		.maybeSingle();

	// The week's targets and entries are extra to the program. If they cannot be read, the page still
	// shows the program rather than failing.
	const snapshot = await loadWeekSnapshot(event.locals.supabase, user.id, today).catch((error) => {
		console.error('Could not load the weekly snapshot', {
			code: (error as { code?: string })?.code
		});
		return null;
	});

	return {
		displayName: profile.display_name,
		coachingMode: profile.coaching_mode,
		program,
		assessmentStatus: (latest?.status as string | undefined) ?? null,
		snapshot,
		today
	};
};

import { requireClient } from '$lib/server/auth/client';
import { loadActiveProgram } from '$lib/server/coaching/templates';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { user, profile } = await requireClient(event);
	event.setHeaders({ 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' });
	const program = await loadActiveProgram(event.locals.supabase, user.id);

	const { data: latest } = await event.locals.supabase
		.from('assessments')
		.select('status')
		.order('created_at', { ascending: false })
		.limit(1)
		.maybeSingle();

	return {
		displayName: profile.display_name,
		coachingMode: profile.coaching_mode,
		program,
		assessmentStatus: (latest?.status as string | undefined) ?? null
	};
};

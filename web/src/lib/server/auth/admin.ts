import { error, redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export async function requireAdmin(event: RequestEvent) {
	const { user } = await event.locals.safeGetUser();
	if (!user) {
		if (event.url.pathname.startsWith('/api/')) error(401, 'Please sign in as an administrator.');
		redirect(303, `/admin/login?redirectTo=${encodeURIComponent(event.url.pathname)}`);
	}

	const { data: profile } = await event.locals.supabase
		.from('admin_profiles')
		.select('id, display_name')
		.eq('id', user.id)
		.maybeSingle();

	if (!profile) error(403, 'Administrator access is required.');
	return { user, profile };
}

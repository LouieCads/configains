import { error, redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export async function requireAdmin(event: RequestEvent) {
	const { user } = await event.locals.safeGetSession();
	if (!user) redirect(303, `/admin/login?redirectTo=${encodeURIComponent(event.url.pathname)}`);

	const { data: profile } = await event.locals.supabase
		.from('admin_profiles')
		.select('id, display_name')
		.eq('id', user.id)
		.maybeSingle();

	if (!profile) error(403, 'Administrator access is required.');
	return { user, profile };
}

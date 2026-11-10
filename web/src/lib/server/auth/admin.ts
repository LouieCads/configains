import { error, redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

type AdminResult = { user: NonNullable<Awaited<ReturnType<App.Locals['safeGetUser']>>['user']> } & {
	profile: { id: string; display_name: string | null };
};

// Layout and page loaders run in parallel and both call requireAdmin; share one check per request.
const checks = new WeakMap<App.Locals, Promise<AdminResult>>();

/**
 * Ensures the request comes from a signed-in user listed in `admin_profiles`.
 * API routes get 401/403; pages redirect to the sign-in screen.
 */
export function requireAdmin(event: RequestEvent): Promise<AdminResult> {
	let check = checks.get(event.locals);
	if (!check) {
		check = verifyAdmin(event);
		checks.set(event.locals, check);
	}
	return check;
}

async function verifyAdmin(event: RequestEvent): Promise<AdminResult> {
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

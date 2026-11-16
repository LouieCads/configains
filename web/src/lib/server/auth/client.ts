import { error, redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Ensures the request comes from a signed-in user listed in `client_profiles`.
 * API routes get 401/403; pages redirect to the sign-in screen.
 */
export async function requireClient(event: RequestEvent) {
	const { user } = await event.locals.safeGetUser();
	if (!user) {
		if (event.url.pathname.startsWith('/api/'))
			error(401, 'Please sign in to your Configains account.');
		redirect(303, `/login?redirectTo=${encodeURIComponent(event.url.pathname)}`);
	}

	const { data: profile } = await event.locals.supabase
		.from('client_profiles')
		.select('id, display_name, coaching_mode')
		.eq('id', user.id)
		.maybeSingle();

	if (!profile) error(403, 'A Configains client account is required.');
	return { user, profile };
}

/**
 * Where to send a client after they sign in: the page that asked them to, when it is inside the
 * client area (`/app`). Anything else, such as another site or the admin area, goes to `/app`.
 */
export function clientDestination(requested: string | null | undefined): string {
	if (typeof requested !== 'string' || requested.length > 200) return '/app';
	if (!/^\/app(?:[/?#][^\\]*)?$/.test(requested) || requested.includes('..')) return '/app';
	return requested;
}

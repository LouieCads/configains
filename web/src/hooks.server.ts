import type { Handle } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/server/supabase';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { allowLocalDemo } from '$lib/server/local-demo-policy';
import { createDemoClient, demoCookie, hasDemoSession } from '$lib/server/local-demo';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.localAdminDemo =
		dev &&
		env.LOCAL_ADMIN_DEMO === 'true' &&
		allowLocalDemo(dev, env.LOCAL_ADMIN_DEMO, event.url.hostname, event.getClientAddress());
	event.locals.supabase = event.locals.localAdminDemo
		? createDemoClient(hasDemoSession(event.cookies.get(demoCookie)))
		: createSupabaseServerClient(event.cookies);
	let verifiedUser: ReturnType<App.Locals['safeGetUser']> | undefined;
	event.locals.safeGetUser = () => {
		// Verify with Auth and share the result across this request's loaders.
		verifiedUser ??= event.locals.supabase.auth
			.getUser()
			.then(({ data, error }) => ({ user: error ? null : data.user }));
		return verifiedUser;
	};

	const response = await resolve(event, {
		filterSerializedResponseHeaders: (name) =>
			name === 'content-range' || name === 'x-supabase-api-version'
	});
	if (event.url.pathname.startsWith('/admin') || event.url.pathname.startsWith('/api/')) {
		response.headers.set('Cache-Control', 'private, no-store');
		response.headers.set('X-Robots-Tag', 'noindex, nofollow');
		// Native POST forms need their same-origin Origin header for CSRF checks.
		// no-referrer makes browsers send Origin: null for these submissions.
		response.headers.set('Referrer-Policy', 'same-origin');
	}
	return response;
};

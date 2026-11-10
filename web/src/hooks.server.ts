import type { Handle, RequestEvent } from '@sveltejs/kit';
import { websitePaths } from '$lib/server/website';
import { createSupabaseServerClient } from '$lib/server/supabase';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { allowLocalDemo } from '$lib/server/local-demo-policy';
import { createDemoClient, demoCookie, hasDemoSession } from '$lib/server/local-demo';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.localAdminDemo = allowLocalDemo(
		dev,
		env.LOCAL_ADMIN_DEMO,
		event.url.hostname,
		event.getClientAddress()
	);
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
	} else if (cacheablePublic(event, response)) {
		// Browsers always revalidate; Netlify's CDN serves a recent copy and refreshes it in the
		// background, so a CMS publish shows up within about a minute.
		response.headers.set('Netlify-CDN-Cache-Control', publicEdgeCache);
	}
	return response;
};

const publicEdgeCache = 'public, s-maxage=60, stale-while-revalidate=600';
const publicPaths = new Set(websitePaths);

/** Anonymous public page (or its client-navigation data) with no per-user or draft content. */
function cacheablePublic(event: RequestEvent, response: Response) {
	if (event.request.method !== 'GET' || response.status !== 200) return false;
	if (event.url.searchParams.has('preview') || response.headers.has('set-cookie')) return false;
	if (
		response.headers.has('cache-control') &&
		/no-store|private/.test(response.headers.get('cache-control')!)
	)
		return false;
	const path = event.url.pathname.replace(/\/__data\.json$/, '') || '/';
	return publicPaths.has(path);
}

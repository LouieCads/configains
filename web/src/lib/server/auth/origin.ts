import { error, type RequestEvent } from '@sveltejs/kit';

/** CSRF guard for state-changing requests: the Origin header must match this site. */
export function requireSameOrigin(event: RequestEvent) {
	if (event.request.headers.get('origin') !== event.url.origin)
		error(403, 'Please make this change from the Configains admin website.');
}

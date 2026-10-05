import { error, type RequestEvent } from '@sveltejs/kit';
import { adminAllowedOrigins } from '$lib/constants/site-origin';

export function requireSameOrigin(event: RequestEvent) {
	const origin = event.request.headers.get('origin');
	if (origin !== event.url.origin && !adminAllowedOrigins.some((allowed) => allowed === origin))
		error(403, 'Please make this change from the Configains admin website.');
}

import { describe, expect, it } from 'vitest';
import { requireSameOrigin } from './origin';
import type { RequestEvent } from '@sveltejs/kit';

function event(url: string, origin?: string) {
	return {
		url: new URL(url),
		request: new Request(url, {
			method: 'POST',
			...(origin ? { headers: { origin } } : {})
		})
	} as RequestEvent;
}

describe('admin request origins', () => {
	it.each([
		'http://localhost:5173',
		'https://configains.fundrstudio.com',
		'https://configainss.netlify.app'
	])('accepts a request from its own origin: %s', (origin) => {
		expect(() => requireSameOrigin(event(`${origin}/admin/logout`, origin))).not.toThrow();
	});

	it.each([undefined, 'null', 'https://evil.example', 'https://configainss.netlify.app'])(
		'rejects missing, opaque, or cross-site origin: %s',
		(origin) => {
			expect(() =>
				requireSameOrigin(event('https://configains.fundrstudio.com/admin/logout', origin))
			).toThrow();
		}
	);
});

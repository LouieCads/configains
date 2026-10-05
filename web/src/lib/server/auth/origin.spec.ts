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
	it('accepts a request from its own origin', () => {
		expect(() =>
			requireSameOrigin(event('http://localhost:5173/admin/logout', 'http://localhost:5173'))
		).not.toThrow();
	});

	it('accepts the public domain when Netlify supplies an internal request URL', () => {
		expect(() =>
			requireSameOrigin(
				event('https://configainss.netlify.app/admin/logout', 'https://configains.fundrstudio.com')
			)
		).not.toThrow();
	});

	it('accepts the Netlify site domain when Netlify supplies the custom-domain URL', () => {
		expect(() =>
			requireSameOrigin(
				event('https://configains.fundrstudio.com/admin/logout', 'https://configainss.netlify.app')
			)
		).not.toThrow();
	});

	it('rejects other origins and requests without an Origin header', () => {
		expect(() =>
			requireSameOrigin(
				event('https://configainss.netlify.app/admin/logout', 'https://evil.example')
			)
		).toThrow();
		expect(() =>
			requireSameOrigin(event('https://configainss.netlify.app/admin/logout'))
		).toThrow();
	});
});

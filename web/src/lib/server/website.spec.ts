import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { readWebsite, websiteOrigin } from './website';

function storedWebsite(canonicalUrl: string) {
	const metadata = { brand: { canonicalUrl, socialImage: '/og-image.png', name: 'Configains' } };
	const query = {
		select: () => query,
		eq: () => query,
		maybeSingle: async () => ({ data: { metadata, updated_at: '2026-10-05' }, error: null })
	};
	return { metadata, client: { from: () => query } as unknown as SupabaseClient };
}

describe('published website domain migration', () => {
	it.each([
		'https://www.cashfuerte.fundrstudio.com',
		'https://cashfuerte.fundrstudio.com/',
		'https://confgains.fundrstudio.com'
	])('corrects the retired CMS domain %s for sharing and canonical links', async (legacyUrl) => {
		const { client, metadata } = storedWebsite(legacyUrl);
		const { content } = await readWebsite(client);
		const origin = websiteOrigin(content, new URL('https://configainss.netlify.app/'));
		expect(origin).toBe('https://configains.fundrstudio.com');
		expect(new URL(content.brand.socialImage, origin).href).toBe(
			'https://configains.fundrstudio.com/og-image.png'
		);
		expect(metadata.brand.canonicalUrl).toBe(legacyUrl);
	});

	it('preserves a different domain selected in the CMS', async () => {
		const { client } = storedWebsite('https://www.example.com');
		const { content } = await readWebsite(client);
		expect(content.brand.canonicalUrl).toBe('https://www.example.com');
	});
});

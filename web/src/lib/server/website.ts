import type { SupabaseClient } from '@supabase/supabase-js';
import { defaultWebsite, normalizeContent, websiteSchema, type Content } from '$lib/content/schema';

export async function readWebsite(supabase: SupabaseClient, draft = false) {
	const { data, error } = await supabase
		.from('site_content')
		.select('metadata, updated_at')
		.eq('key', draft ? 'website.draft' : 'website')
		.maybeSingle();
	const content = data
		? (normalizeContent(websiteSchema, data.metadata) as Content)
		: defaultWebsite();
	// Older published CMS documents retain the original domain after code defaults change.
	const legacyOrigins = [
		'https://www.cashfuerte.fundrstudio.com',
		'https://cashfuerte.fundrstudio.com',
		'https://confgains.fundrstudio.com'
	];
	if (legacyOrigins.includes(content.brand.canonicalUrl.replace(/\/+$/, '')))
		content.brand.canonicalUrl = defaultWebsite().brand.canonicalUrl;
	return {
		content,
		revision: data?.updated_at ?? null,
		error
	};
}

export const websitePaths = ['/', '/about', '/coaching', '/transformations', '/contact'] as const;
export function websiteOrigin(content: Content, requestUrl: URL) {
	return content.brand.canonicalUrl?.replace(/\/+$/, '') || requestUrl.origin;
}

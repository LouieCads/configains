import type { SupabaseClient } from '@supabase/supabase-js';
import { defaultWebsite, normalizeContent, websiteSchema, type Content } from '$lib/content/schema';

export async function readWebsite(supabase: SupabaseClient, draft = false) {
	const { data, error } = await supabase
		.from('site_content')
		.select('metadata, updated_at')
		.eq('key', draft ? 'website.draft' : 'website')
		.maybeSingle();
	return {
		content: data ? (normalizeContent(websiteSchema, data.metadata) as Content) : defaultWebsite(),
		revision: data?.updated_at ?? null,
		error
	};
}

export const websitePaths = ['/', '/about', '/coaching', '/transformations', '/contact'] as const;
export function websiteOrigin(content: Content, requestUrl: URL) {
	return content.brand.canonicalUrl?.replace(/\/+$/, '') || requestUrl.origin;
}

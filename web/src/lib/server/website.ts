/**
 * Reads the website document from `site_content`.
 *
 * The published copy lives under key `website`; the admin's private draft
 * lives under `website.draft`. `updated_at` doubles as the revision token used
 * for optimistic concurrency when saving and publishing.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import {
	defaultWebsite,
	normalizeContent,
	websitePagePath,
	websitePages,
	websiteSchema,
	type Content
} from '$lib/content/schema';

/** Retired domains that may still be stored in older published documents. */
const legacyOrigins = [
	'https://www.cashfuerte.fundrstudio.com',
	'https://cashfuerte.fundrstudio.com',
	'https://confgains.fundrstudio.com'
];

/**
 * Loads the published (or draft) website, normalized to the current schema.
 * Falls back to default content when no document exists or the query fails;
 * callers decide how to surface `error`.
 */
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
	if (legacyOrigins.includes(content.brand.canonicalUrl.replace(/\/+$/, '')))
		content.brand.canonicalUrl = defaultWebsite().brand.canonicalUrl;
	return {
		content,
		revision: data?.updated_at ?? null,
		error
	};
}

/**
 * Loads what the admin editor should show: the saved draft if one exists,
 * otherwise the published content as a starting point.
 */
export async function readEditableWebsite(supabase: SupabaseClient) {
	const [draft, published] = await Promise.all([
		readWebsite(supabase, true),
		readWebsite(supabase)
	]);
	return {
		content: draft.revision ? draft.content : published.content,
		revision: draft.revision,
		publishedRevision: published.revision,
		unavailable: Boolean(draft.error || published.error)
	};
}

/** Public page paths, used by the sitemap. */
export const websitePaths = websitePages.map(websitePagePath);

/** Canonical origin for absolute links, falling back to the request's origin. */
export function websiteOrigin(content: Content, requestUrl: URL) {
	return content.brand.canonicalUrl?.replace(/\/+$/, '') || requestUrl.origin;
}

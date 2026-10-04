import { requireAdmin } from '$lib/server/auth/admin';
import { readWebsite, websiteOrigin } from '$lib/server/website';

export const load = async (event) => {
	const { locals, url } = event;
	const preview = url.searchParams.get('preview') === '1';
	if (preview) await requireAdmin(event);
	let website = await readWebsite(locals.supabase, preview);
	if (preview && !website.revision) website = await readWebsite(locals.supabase);
	if (preview)
		event.setHeaders({ 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' });
	return {
		localAdminDemo: locals.localAdminDemo,
		site: website.content,
		siteOrigin: websiteOrigin(website.content, url),
		preview
	};
};

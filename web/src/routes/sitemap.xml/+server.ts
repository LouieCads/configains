import { readWebsite, websiteOrigin, websitePaths } from '$lib/server/website';
import { xmlEscape } from '$lib/content/seo';

export const GET = async ({ locals, url }) => {
	const { content, revision } = await readWebsite(locals.supabase);
	const origin = websiteOrigin(content, url);
	const paths = websitePaths.filter((path) => path !== '/transformations' || content.home.proof);
	const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${xmlEscape(origin + path)}</loc>${revision ? `<lastmod>${xmlEscape(revision)}</lastmod>` : ''}</url>`).join('')}</urlset>`;
	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=0, must-revalidate'
		}
	});
};

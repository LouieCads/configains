import { readWebsite, websiteOrigin } from '$lib/server/website';

export const GET = async ({ locals, url }) => {
	const { content } = await readWebsite(locals.supabase);
	return new Response(
		`User-agent: *\nDisallow: /admin\nDisallow: /api/\nDisallow: /*?*preview=\n\nSitemap: ${websiteOrigin(content, url)}/sitemap.xml\n`,
		{
			headers: {
				'Content-Type': 'text/plain; charset=utf-8',
				'Cache-Control': 'public, max-age=0, must-revalidate'
			}
		}
	);
};

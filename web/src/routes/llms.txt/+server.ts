import { readWebsite, websiteOrigin } from '$lib/server/website';
import { llmsText } from '$lib/content/seo';

export const GET = async ({ locals, url }) => {
	const { content } = await readWebsite(locals.supabase);
	return new Response(llmsText(content, websiteOrigin(content, url)), {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=0, must-revalidate'
		}
	});
};

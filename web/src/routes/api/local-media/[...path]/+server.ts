import { error } from '@sveltejs/kit';
import { readDemoImage } from '$lib/server/local-demo';

export const GET = async ({ locals, params }) => {
	if (!locals.localAdminDemo) error(404, 'Not found.');
	try {
		const { body, type } = await readDemoImage(params.path);
		return new Response(body, {
			headers: { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff' }
		});
	} catch {
		error(404, 'Local image not found.');
	}
};

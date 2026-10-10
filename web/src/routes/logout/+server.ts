import { redirect, type RequestHandler } from '@sveltejs/kit';
import { requireSameOrigin } from '$lib/server/auth/origin';

// Client sign-out. The browser clears its offline data before this form posts.
export const POST: RequestHandler = async (event) => {
	requireSameOrigin(event);
	await event.locals.supabase.auth.signOut();
	redirect(303, '/login');
};

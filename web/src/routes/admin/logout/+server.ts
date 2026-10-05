import { redirect } from '@sveltejs/kit';
import { requireSameOrigin } from '$lib/server/auth/origin';
import { demoCookie, endDemoSession } from '$lib/server/local-demo';
export const POST = async (event) => {
	requireSameOrigin(event);
	const { locals } = event;
	if (locals.localAdminDemo) {
		endDemoSession(event.cookies.get(demoCookie));
		event.cookies.delete(demoCookie, { path: '/' });
	} else {
		const { error } = await locals.supabase.auth.signOut();
		if (error) throw error;
	}
	redirect(303, '/admin/login');
};

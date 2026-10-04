import { fail, redirect } from '@sveltejs/kit';
import { demoCookie, startDemoSession } from '$lib/server/local-demo';
import { requireSameOrigin } from '$lib/server/auth/origin';

export const load = async ({ locals, url }) => {
	const { user } = await locals.safeGetUser();
	if (user) {
		const { data } = await locals.supabase
			.from('admin_profiles')
			.select('id')
			.eq('id', user.id)
			.maybeSingle();
		if (data) redirect(303, '/admin/dashboard');
	}
	return {
		localAdminDemo: locals.localAdminDemo,
		passwordUpdated: url.searchParams.get('password') === 'updated'
	};
};

export const actions = {
	default: async (event) => {
		const { request, locals, url, cookies } = event;
		if (locals.localAdminDemo) {
			requireSameOrigin(event);
			cookies.set(demoCookie, startDemoSession(), {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				secure: false,
				maxAge: 8 * 60 * 60
			});
			redirect(303, '/admin/dashboard');
		}
		const form = await request.formData();
		const email = String(form.get('email') ?? '');
		const password = String(form.get('password') ?? '');
		if (!email || !password)
			return fail(400, { message: 'Email and password are required.', email });

		const { error } = await locals.supabase.auth.signInWithPassword({ email, password });
		if (error) return fail(400, { message: 'The email or password is incorrect.', email });
		const {
			data: { user }
		} = await locals.supabase.auth.getUser();
		const { data: profile } = await locals.supabase
			.from('admin_profiles')
			.select('id')
			.eq('id', user?.id ?? '')
			.maybeSingle();
		if (!profile) {
			await locals.supabase.auth.signOut();
			return fail(403, { message: 'This account does not have administrator access.', email });
		}

		const destination = url.searchParams.get('redirectTo');
		redirect(
			303,
			destination && /^\/admin\/(?!login(?:[/?]|$))[^\\]*$/.test(destination)
				? destination
				: '/admin/dashboard'
		);
	}
};

import { fail, redirect } from '@sveltejs/kit';
import { requireSameOrigin } from '$lib/server/auth/origin';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { user } = await locals.safeGetUser();
	if (user) {
		const { data } = await locals.supabase
			.from('client_profiles')
			.select('id')
			.eq('id', user.id)
			.maybeSingle();
		if (data) redirect(303, '/app');
	}
	return { passwordSet: url.searchParams.get('password') === 'set' };
};

export const actions = {
	default: async (event) => {
		requireSameOrigin(event);
		const form = await event.request.formData();
		const email = String(form.get('email') ?? '');
		const password = String(form.get('password') ?? '');
		if (!email || !password)
			return fail(400, { message: 'Email and password are required.', email });

		const { error } = await event.locals.supabase.auth.signInWithPassword({ email, password });
		if (error) return fail(400, { message: 'The email or password is incorrect.', email });

		const {
			data: { user }
		} = await event.locals.supabase.auth.getUser();
		const { data: profile } = await event.locals.supabase
			.from('client_profiles')
			.select('id')
			.eq('id', user?.id ?? '')
			.maybeSingle();
		if (!profile) {
			await event.locals.supabase.auth.signOut();
			return fail(403, { message: 'This account is not a Configains client account.', email });
		}
		redirect(303, '/app');
	}
} satisfies Actions;

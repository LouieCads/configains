import { fail, redirect } from '@sveltejs/kit';
import { clientDestination } from '$lib/server/auth/client';
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
		// Already signed in: go straight to the page they wanted.
		if (data) redirect(303, clientDestination(url.searchParams.get('redirectTo')));
	}
	const notice = url.searchParams.get('password') ?? url.searchParams.get('notice');
	return {
		// "set" after accepting an invitation, "updated" after a reset, "not-client" when a signed-in
		// account that is not a client opened a client page.
		notice: notice === 'set' || notice === 'updated' || notice === 'not-client' ? notice : null
	};
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
		redirect(303, clientDestination(event.url.searchParams.get('redirectTo')));
	}
} satisfies Actions;

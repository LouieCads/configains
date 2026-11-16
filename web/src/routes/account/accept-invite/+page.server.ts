import { fail, redirect } from '@sveltejs/kit';
import { validNewPassword, validRecoveryToken } from '$lib/server/auth/recovery';
import { requireSameOrigin } from '$lib/server/auth/origin';
import type { Actions, PageServerLoad } from './$types';

// GET only reads the link. The one-use token is consumed on POST, so email scanners cannot spend it.
export const load: PageServerLoad = async ({ url, locals }) => {
	const token = url.searchParams.get('token_hash');
	const code = url.searchParams.get('code');

	// Someone who is already signed in as a client has an account. Do not offer to set one up again.
	// The page says so and links to their plan instead of showing the password form.
	let signedIn = false;
	const { user } = await locals.safeGetUser();
	if (user) {
		const { data } = await locals.supabase
			.from('client_profiles')
			.select('id')
			.eq('id', user.id)
			.maybeSingle();
		signedIn = Boolean(data);
	}

	return {
		signedIn,
		tokenHash: validRecoveryToken(token) ? token : null,
		authCode: validRecoveryToken(code) ? code : null
	};
};

export const actions = {
	default: async (event) => {
		requireSameOrigin(event);
		const form = await event.request.formData();
		const token = form.get('token_hash');
		const code = form.get('code');
		if (!validRecoveryToken(token) && !validRecoveryToken(code))
			return fail(400, {
				linkUsed: false,
				message: 'This invitation link is invalid. Ask for a new invitation.'
			});

		const password = String(form.get('password') ?? '');
		const confirmation = String(form.get('confirmation') ?? '');
		const passwordError = validNewPassword(password, confirmation);
		if (passwordError) return fail(400, { linkUsed: false, message: passwordError });

		const { data, error } = validRecoveryToken(code)
			? await event.locals.supabase.auth.exchangeCodeForSession(code)
			: await event.locals.supabase.auth.verifyOtp({ token_hash: token as string, type: 'invite' });
		if (error || !data.user)
			// An invitation works once. The usual reason it fails is that the client already used it
			// to set their password, so the page leads them to sign in. Their account, program and
			// logged data are untouched either way.
			return fail(400, {
				linkUsed: true,
				message: 'This invitation link has already been used or has expired.'
			});

		const { data: profile } = await event.locals.supabase
			.from('client_profiles')
			.select('id')
			.eq('id', data.user.id)
			.maybeSingle();
		if (!profile) {
			await event.locals.supabase.auth.signOut();
			return fail(403, {
				linkUsed: false,
				message: 'This invitation is not for a Configains client account.'
			});
		}

		const { error: passwordUpdateError } = await event.locals.supabase.auth.updateUser({
			password
		});
		if (passwordUpdateError)
			return fail(400, {
				linkUsed: false,
				message: 'The password could not be set. Try a stronger password.'
			});

		await event.locals.supabase.auth.signOut();
		redirect(303, '/login?password=set');
	}
} satisfies Actions;

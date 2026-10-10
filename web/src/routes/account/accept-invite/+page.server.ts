import { fail, redirect } from '@sveltejs/kit';
import { validNewPassword, validRecoveryToken } from '$lib/server/auth/recovery';
import { requireSameOrigin } from '$lib/server/auth/origin';
import type { Actions, PageServerLoad } from './$types';

// GET only reads the link. The one-use token is consumed on POST, so email scanners cannot spend it.
export const load: PageServerLoad = ({ url }) => {
	const token = url.searchParams.get('token_hash');
	const code = url.searchParams.get('code');
	return {
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
			return fail(400, { message: 'This invitation link is invalid. Ask for a new invitation.' });

		const password = String(form.get('password') ?? '');
		const confirmation = String(form.get('confirmation') ?? '');
		const passwordError = validNewPassword(password, confirmation);
		if (passwordError) return fail(400, { message: passwordError });

		const { data, error } = validRecoveryToken(code)
			? await event.locals.supabase.auth.exchangeCodeForSession(code)
			: await event.locals.supabase.auth.verifyOtp({ token_hash: token as string, type: 'invite' });
		if (error || !data.user)
			return fail(400, {
				message: 'This invitation has expired or was already used. Ask for a new invitation.'
			});

		const { data: profile } = await event.locals.supabase
			.from('client_profiles')
			.select('id')
			.eq('id', data.user.id)
			.maybeSingle();
		if (!profile) {
			await event.locals.supabase.auth.signOut();
			return fail(403, { message: 'This invitation is not for a Configains client account.' });
		}

		const { error: passwordUpdateError } = await event.locals.supabase.auth.updateUser({
			password
		});
		if (passwordUpdateError)
			return fail(400, {
				message: 'The password could not be set. Try a stronger password.'
			});

		await event.locals.supabase.auth.signOut();
		redirect(303, '/login?password=set');
	}
} satisfies Actions;

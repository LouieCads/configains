import { fail, redirect } from '@sveltejs/kit';
import { requireSameOrigin } from '$lib/server/auth/origin';
import { validRecoveryToken } from '$lib/server/auth/recovery';
import type { Actions, PageServerLoad } from './$types';

// GET displays a confirmation only. Do not consume a one-use recovery link here.
export const load: PageServerLoad = ({ url, locals }) => {
	const token = url.searchParams.get('token_hash');
	const code = url.searchParams.get('code');
	return {
		tokenHash: validRecoveryToken(token) ? token : null,
		authCode: validRecoveryToken(code) ? code : null,
		localAdminDemo: locals.localAdminDemo
	};
};

export const actions = {
	default: async (event) => {
		requireSameOrigin(event);
		if (event.locals.localAdminDemo)
			return fail(400, { message: 'Recovery links cannot be used in the local demo.' });
		const form = await event.request.formData();
		const token = form.get('token_hash');
		const code = form.get('code');
		if (!validRecoveryToken(token) && !validRecoveryToken(code))
			return fail(400, { message: 'This recovery link is invalid. Request a new link.' });
		const { data, error } = validRecoveryToken(code)
			? await event.locals.supabase.auth.exchangeCodeForSession(code)
			: await event.locals.supabase.auth.verifyOtp({
					token_hash: token as string,
					type: 'recovery'
				});
		if (error || !data.user)
			return fail(400, {
				message: 'This link has expired or has already been used. Request a new link.'
			});
		const { data: profile, error: profileError } = await event.locals.supabase
			.from('admin_profiles')
			.select('id')
			.eq('id', data.user.id)
			.maybeSingle();
		if (!profile || profileError) {
			await event.locals.supabase.auth.signOut();
			return fail(403, { message: 'This account does not have administrator access.' });
		}
		redirect(303, '/admin/reset-password');
	}
} satisfies Actions;

import { fail, redirect } from '@sveltejs/kit';
import { requireSameOrigin } from '$lib/server/auth/origin';
import { validRecoveryToken } from '$lib/server/auth/recovery';
import type { Actions, PageServerLoad } from './$types';

// GET displays a confirmation only. Email scanners must not consume a one-use token.
export const load: PageServerLoad = ({ url, locals }) => {
	const token = url.searchParams.get('token_hash');
	return {
		tokenHash: validRecoveryToken(token) ? token : null,
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
		if (!validRecoveryToken(token))
			return fail(400, { message: 'This recovery link is invalid. Request a new link.' });
		const { data, error } = await event.locals.supabase.auth.verifyOtp({
			token_hash: token,
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

import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { requireClient } from '$lib/server/auth/client';
import { requireSameOrigin } from '$lib/server/auth/origin';
import { validNewPassword } from '$lib/server/auth/recovery';
import type { Actions, PageServerLoad } from './$types';

// A client reaches this page from a recovery link (checked at /admin/recover), already signed in
// with a short recovery session. Without one, send them to ask for a new link.
async function recoveringClient(event: RequestEvent) {
	const { user } = await event.locals.safeGetUser();
	if (!user) redirect(303, '/forgot-password?expired=1');
	return requireClient(event);
}

export const load: PageServerLoad = async (event) => {
	await recoveringClient(event);
	return {};
};

export const actions = {
	default: async (event) => {
		requireSameOrigin(event);
		await recoveringClient(event);
		const form = await event.request.formData();
		const password = String(form.get('password') ?? '');
		const confirmation = String(form.get('confirmation') ?? '');
		const passwordError = validNewPassword(password, confirmation);
		if (passwordError) return fail(400, { updated: false, message: passwordError });

		const { error } = await event.locals.supabase.auth.updateUser({ password });
		if (error)
			return fail(400, {
				updated: false,
				message:
					error.code === 'same_password'
						? 'Choose a password different from your current password.'
						: 'The password could not be updated. Try a stronger password or request a new reset link.'
			});

		// Their account, program and logged data are untouched: they sign in again with the new password.
		const { error: signOutError } = await event.locals.supabase.auth.signOut();
		if (signOutError)
			return fail(503, {
				updated: true,
				message:
					'Your password was updated, but sign-out failed. Please sign out before signing in with your new password.'
			});
		redirect(303, '/login?password=updated');
	}
} satisfies Actions;

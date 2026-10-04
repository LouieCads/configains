import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth/admin';
import { requireSameOrigin } from '$lib/server/auth/origin';
import type { Actions, PageServerLoad } from './$types';

async function passwordAdmin(event: RequestEvent) {
	if (event.locals.localAdminDemo) redirect(303, '/admin/forgot-password');
	const { user } = await event.locals.safeGetUser();
	if (!user) redirect(303, '/admin/forgot-password?expired=1');
	return requireAdmin(event);
}

export const load: PageServerLoad = async (event) => {
	await passwordAdmin(event);
	return {};
};

export const actions = {
	default: async (event) => {
		requireSameOrigin(event);
		await passwordAdmin(event);
		const form = await event.request.formData();
		const password = String(form.get('password') ?? '');
		const confirmation = String(form.get('confirmation') ?? '');
		if (password.length < 12 || password.length > 128 || !password.trim())
			return fail(400, {
				updated: false,
				message: 'Use a password between 12 and 128 characters.'
			});
		if (password !== confirmation)
			return fail(400, { updated: false, message: 'The passwords do not match.' });
		const { error } = await event.locals.supabase.auth.updateUser({ password });
		if (error)
			return fail(400, {
				updated: false,
				message:
					error.code === 'same_password'
						? 'Choose a password different from your current password.'
						: 'The password could not be updated. Try a stronger password or request a new reset link.'
			});
		const { error: signOutError } = await event.locals.supabase.auth.signOut();
		if (signOutError)
			return fail(503, {
				updated: true,
				message:
					'Your password was updated, but sign-out failed. Please sign out before signing in with your new password.'
			});
		redirect(303, '/admin/login?password=updated');
	}
} satisfies Actions;

import { fail } from '@sveltejs/kit';
import { requireSameOrigin } from '$lib/server/auth/origin';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => ({
	localAdminDemo: locals.localAdminDemo,
	expired: url.searchParams.get('expired') === '1'
});

export const actions = {
	default: async (event) => {
		requireSameOrigin(event);
		if (event.locals.localAdminDemo)
			return fail(400, { message: 'Password recovery is available on the live website.' });
		const form = await event.request.formData();
		const email = String(form.get('email') ?? '').trim();
		if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
			return fail(400, { message: 'Enter a valid email address.' });
		const { error } = await event.locals.supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${event.url.origin}/admin/recover`
		});
		if (error?.status === 429)
			return fail(429, { message: 'Please wait a few minutes before requesting another link.' });
		if (error && (!error.status || error.status >= 500))
			return fail(503, { message: 'We could not send a recovery email. Please try again later.' });
		// Keep account existence private, including provider responses for unknown users.
		return { sent: true };
	}
} satisfies Actions;

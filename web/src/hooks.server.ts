import type { Handle } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/server/supabase';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createSupabaseServerClient(event.cookies);
	event.locals.safeGetSession = async () => {
		const { data, error } = await event.locals.supabase.auth.getClaims();
		if (error || !data?.claims) return { session: null, user: null };

		const { data: sessionData } = await event.locals.supabase.auth.getSession();
		const { data: userData } = await event.locals.supabase.auth.getUser();
		return { session: sessionData.session, user: userData.user };
	};

	return resolve(event, {
		filterSerializedResponseHeaders: (name) =>
			name === 'content-range' || name === 'x-supabase-api-version'
	});
};

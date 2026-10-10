import { fail, redirect } from '@sveltejs/kit';
import { cleanText } from '$lib/coaching/text';
import { requireClient } from '$lib/server/auth/client';
import { requireSameOrigin } from '$lib/server/auth/origin';
import { loadActiveProgram } from '$lib/server/coaching/templates';
import { loadCoachingThread, sendMessage, submitCheckIn } from '$lib/server/coaching/human';
import type { Actions, PageServerLoad } from './$types';

const checkInLimit = 4000;
const messageLimit = 2000;

// Check-ins and messages belong to Human Coaching. AI-coached clients are sent back to their program.
export const load: PageServerLoad = async (event) => {
	const { user, profile } = await requireClient(event);
	if (profile.coaching_mode !== 'human') redirect(303, '/app');
	event.setHeaders({ 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' });

	const [program, thread] = await Promise.all([
		loadActiveProgram(event.locals.supabase, user.id),
		loadCoachingThread(event.locals.supabase, user.id)
	]);
	return { ...thread, programId: program?.id ?? null, displayName: profile.display_name };
};

export const actions = {
	checkin: async (event) => {
		requireSameOrigin(event);
		const { user, profile } = await requireClient(event);
		if (profile.coaching_mode !== 'human')
			return fail(403, { message: 'Check-ins are part of Human Coaching.' });

		const body = cleanText((await event.request.formData()).get('body'), checkInLimit);
		if (!body)
			return fail(400, { message: `Write a check-in of up to ${checkInLimit} characters.` });

		const program = await loadActiveProgram(event.locals.supabase, user.id);
		const result = await submitCheckIn(event.locals.supabase, user.id, program?.id ?? null, body);
		if (!result.ok) return fail(400, { message: 'Your check-in could not be sent. Try again.' });
		return { updated: 'checkin' };
	},

	message: async (event) => {
		requireSameOrigin(event);
		const { user, profile } = await requireClient(event);
		if (profile.coaching_mode !== 'human')
			return fail(403, { message: 'Messages are part of Human Coaching.' });

		const body = cleanText((await event.request.formData()).get('body'), messageLimit);
		if (!body)
			return fail(400, { message: `Write a message of up to ${messageLimit} characters.` });

		const result = await sendMessage(event.locals.supabase, user.id, 'client', body);
		if (!result.ok) return fail(400, { message: 'Your message could not be sent. Try again.' });
		return { updated: 'message' };
	}
} satisfies Actions;

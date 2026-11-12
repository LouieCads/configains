import { error, fail } from '@sveltejs/kit';
import { cleanText, isUuid } from '$lib/coaching/text';
import { requireAdmin } from '$lib/server/auth/admin';
import { requireSameOrigin } from '$lib/server/auth/origin';
import { loadCoachingThread, saveCheckInFeedback, sendMessage } from '$lib/server/coaching/human';
import { markMessagesRead } from '$lib/server/coaching/tasks';
import type { Actions, PageServerLoad } from './$types';

const messageLimit = 2000;
const feedbackLimit = 4000;

/** One client's check-ins and messages, on their own page. */
export const load: PageServerLoad = async (event) => {
	const clientId = event.params.id;
	if (!isUuid(clientId)) {
		await requireAdmin(event);
		error(404, 'Client not found.');
	}
	const supabase = event.locals.supabase;
	const [, profileResult, thread] = await Promise.all([
		requireAdmin(event),
		supabase
			.from('client_profiles')
			.select('id, display_name, coaching_mode')
			.eq('id', clientId)
			.maybeSingle(),
		loadCoachingThread(supabase, clientId)
	]);
	if (profileResult.error) error(500, 'The client could not be loaded.');
	if (!profileResult.data) error(404, 'Client not found.');

	// Opening this page counts as reading their messages. This load's copy still shows which were new.
	if (thread.messages.some((message) => message.sender_role === 'client' && !message.read_at))
		await markMessagesRead(supabase, clientId);

	return { client: profileResult.data, ...thread };
};

export const actions = {
	feedback: async (event) => {
		requireSameOrigin(event);
		await requireAdmin(event);
		const clientId = event.params.id;
		const form = await event.request.formData();
		const checkInId = String(form.get('check_in_id') ?? '');
		const feedback = cleanText(form.get('feedback'), feedbackLimit);
		if (!isUuid(clientId) || !isUuid(checkInId))
			return fail(400, { message: 'The check-in could not be found.' });
		if (!feedback)
			return fail(400, { message: `Write feedback of up to ${feedbackLimit} characters.` });

		const result = await saveCheckInFeedback(event.locals.supabase, clientId, checkInId, feedback);
		if (!result.ok) return fail(400, { message: 'The feedback could not be saved. Try again.' });
		return { updated: 'feedback' };
	},

	reply: async (event) => {
		requireSameOrigin(event);
		await requireAdmin(event);
		const clientId = event.params.id;
		const body = cleanText((await event.request.formData()).get('body'), messageLimit);
		if (!isUuid(clientId)) return fail(404, { message: 'Client not found.' });
		if (!body)
			return fail(400, { message: `Write a message of up to ${messageLimit} characters.` });

		const result = await sendMessage(event.locals.supabase, clientId, 'coach', body);
		if (!result.ok) return fail(400, { message: 'The message could not be sent. Try again.' });
		return { updated: 'reply' };
	}
} satisfies Actions;

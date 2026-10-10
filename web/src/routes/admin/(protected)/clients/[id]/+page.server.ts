import { error, fail, type RequestEvent } from '@sveltejs/kit';
import { cleanText, isUuid } from '$lib/coaching/text';
import { requireAdmin } from '$lib/server/auth/admin';
import { requireSameOrigin } from '$lib/server/auth/origin';
import { loadActiveProgram } from '$lib/server/coaching/templates';
import { loadCoachingThread, saveCheckInFeedback, sendMessage } from '$lib/server/coaching/human';
import { loadProgress } from '$lib/server/coaching/progress';
import type { Actions, PageServerLoad } from './$types';

const messageLimit = 2000;
const feedbackLimit = 4000;

export const load: PageServerLoad = async (event) => {
	await requireAdmin(event);
	const clientId = event.params.id;
	if (!isUuid(clientId)) error(404, 'Client not found.');

	const { data: profile, error: profileError } = await event.locals.supabase
		.from('client_profiles')
		.select('id, display_name, coaching_mode, created_at')
		.eq('id', clientId)
		.maybeSingle();
	if (profileError) error(500, 'The client could not be loaded.');
	if (!profile) error(404, 'Client not found.');

	const [program, thread] = await Promise.all([
		loadActiveProgram(event.locals.supabase, clientId),
		loadCoachingThread(event.locals.supabase, clientId)
	]);

	const progress = await loadProgress(
		event.locals.supabase,
		clientId,
		new Date().toISOString().slice(0, 10)
	);

	return { client: profile, program, ...thread, progress };
};

/** Actions run only against the client's own active program, so an id from another client is rejected. */
async function ownActiveProgram(event: RequestEvent, clientId: string, programId: string) {
	const program = await loadActiveProgram(event.locals.supabase, clientId);
	return program && program.id === programId ? program : null;
}

export const actions = {
	phase: async (event) => {
		requireSameOrigin(event);
		await requireAdmin(event);
		const clientId = event.params.id;
		const form = await event.request.formData();
		const programId = String(form.get('program_id') ?? '');
		const phaseId = String(form.get('phase_id') ?? '');
		if (!isUuid(clientId) || !isUuid(programId) || !isUuid(phaseId))
			return fail(400, { message: 'Choose a phase to move the client to.' });
		if (!(await ownActiveProgram(event, clientId, programId)))
			return fail(404, { message: 'This program is no longer active.' });

		const { error: rpcError } = await event.locals.supabase.rpc('set_client_phase', {
			p_program_id: programId,
			p_phase_id: phaseId
		});
		if (rpcError)
			return fail(400, {
				message:
					rpcError.code === '22023'
						? rpcError.message
						: 'The phase could not be changed. Try again.'
			});
		return { updated: 'phase' };
	},

	customise: async (event) => {
		requireSameOrigin(event);
		await requireAdmin(event);
		const clientId = event.params.id;
		const programId = String((await event.request.formData()).get('program_id') ?? '');
		if (!isUuid(clientId) || !isUuid(programId))
			return fail(400, { message: 'The program could not be found.' });
		const program = await ownActiveProgram(event, clientId, programId);
		if (!program) return fail(404, { message: 'This program is no longer active.' });

		const { error: rpcError } = await event.locals.supabase.rpc('customise_client_program', {
			p_program_id: programId
		});
		if (rpcError) return fail(400, { message: 'The program could not be customised. Try again.' });
		return { updated: 'customise' };
	},

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

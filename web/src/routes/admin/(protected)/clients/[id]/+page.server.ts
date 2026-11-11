import { error, fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { recommendedPrograms } from '$lib/coaching/matching';
import { cleanText, isUuid } from '$lib/coaching/text';
import { requireAdmin } from '$lib/server/auth/admin';
import { requireSameOrigin } from '$lib/server/auth/origin';
import {
	assignProgram,
	explanationOf,
	listAssignable,
	loadActiveProgram,
	markAssessmentsReviewed
} from '$lib/server/coaching/templates';
import { loadCoachingThread, saveCheckInFeedback, sendMessage } from '$lib/server/coaching/human';
import { loadProgress } from '$lib/server/coaching/progress';
import type { Actions, PageServerLoad } from './$types';

const messageLimit = 2000;
const feedbackLimit = 4000;

export const load: PageServerLoad = async (event) => {
	const clientId = event.params.id;
	if (!isUuid(clientId)) {
		await requireAdmin(event);
		error(404, 'Client not found.');
	}

	// Everything loads in one round: the admin check runs alongside the queries (RLS still limits
	// what a non-admin could read, and a failed check discards the results).
	const supabase = event.locals.supabase;
	const [, profileResult, program, thread, progress, templates, latest] = await Promise.all([
		requireAdmin(event),
		supabase
			.from('client_profiles')
			.select('id, display_name, coaching_mode, created_at')
			.eq('id', clientId)
			.maybeSingle(),
		loadActiveProgram(supabase, clientId),
		loadCoachingThread(supabase, clientId),
		loadProgress(supabase, clientId, new Date().toISOString().slice(0, 10)),
		// Only active (non-archived) library templates can be assigned.
		listAssignable(supabase),
		supabase
			.from('assessments')
			.select('id, status, answers, red_flags, created_at, ai_recommendations(explanation)')
			.eq('client_id', clientId)
			.order('created_at', { ascending: false })
			.limit(1)
			.maybeSingle()
	]);
	const { data: profile, error: profileError } = profileResult;
	if (profileError) error(500, 'The client could not be loaded.');
	if (!profile) error(404, 'Client not found.');

	const assessment = latest.data;

	return {
		client: profile,
		program,
		...thread,
		progress,
		assessment: assessment
			? {
					id: assessment.id,
					status: assessment.status,
					created_at: assessment.created_at,
					answers: (assessment.answers ?? {}) as Record<string, unknown>,
					red_flags: (assessment.red_flags ?? []) as string[],
					explanation: explanationOf(assessment.ai_recommendations)
				}
			: null,
		recommended: recommendedPrograms(assessment?.answers, templates),
		workoutTemplates: templates.filter((template) => template.kind === 'workout'),
		nutritionTemplates: templates.filter((template) => template.kind === 'nutrition')
	};
};

/** Actions run only against the client's own active program, so an id from another client is rejected. */
async function ownActiveProgram(event: RequestEvent, clientId: string, programId: string) {
	const program = await loadActiveProgram(event.locals.supabase, clientId);
	return program && program.id === programId ? program : null;
}

/** Makes (or reuses) the client's private copy of their workout. Returns its template id. */
async function customiseProgram(event: RequestEvent, programId: string) {
	const { data, error: rpcError } = await event.locals.supabase.rpc('customise_client_program', {
		p_program_id: programId
	});
	return rpcError || typeof data !== 'string' ? null : data;
}

export const actions = {
	assign: async (event) => {
		requireSameOrigin(event);
		await requireAdmin(event);
		const clientId = event.params.id;
		const form = await event.request.formData();
		const workoutId = String(form.get('workout_template_id') ?? '');
		const nutritionId = String(form.get('nutrition_template_id') ?? '') || null;
		if (!isUuid(clientId) || !workoutId)
			return fail(400, { message: 'Choose a workout template.' });

		const result = await assignProgram(event.locals.supabase, clientId, workoutId, nutritionId);
		if (!result.ok) return fail(400, { message: result.message });
		await markAssessmentsReviewed(event.locals.supabase, clientId);

		// Assign and customise in one step: open the client's private copy straight away.
		if (form.get('customise') === '1') {
			const program = await loadActiveProgram(event.locals.supabase, clientId);
			const copy = program ? await customiseProgram(event, program.id) : null;
			if (!copy)
				return fail(400, {
					message: 'The program was assigned, but the copy could not be made. Use Customise.'
				});
			redirect(303, `/admin/templates/${copy}?client=${clientId}`);
		}
		return { updated: 'assign' };
	},

	mode: async (event) => {
		requireSameOrigin(event);
		await requireAdmin(event);
		const clientId = event.params.id;
		const mode = String((await event.request.formData()).get('mode') ?? '');
		if (!isUuid(clientId) || (mode !== 'human' && mode !== 'ai'))
			return fail(400, { message: 'Choose a coaching mode.' });

		const { error: modeError } = await event.locals.supabase
			.from('client_profiles')
			.update({ coaching_mode: mode })
			.eq('id', clientId);
		if (modeError)
			return fail(400, { message: 'The coaching mode could not be changed. Try again.' });
		if (mode === 'human') await markAssessmentsReviewed(event.locals.supabase, clientId);
		return { updated: 'mode' };
	},

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

		const copy = await customiseProgram(event, programId);
		if (!copy) return fail(400, { message: 'The program could not be customised. Try again.' });
		redirect(303, `/admin/templates/${copy}?client=${clientId}`);
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

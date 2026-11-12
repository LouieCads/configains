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
import { loadProgress } from '$lib/server/coaching/progress';
import { loadConversationCounts } from '$lib/server/coaching/human';
import { inviteState, resendInvite, type InviteState } from '$lib/server/auth/invites';
import { createServiceClient } from '$lib/server/supabase-admin';
import type { Actions, PageServerLoad } from './$types';

const nameLimit = 120;

/** Service-role client, or null when the secret is not configured (local development). */
function serviceClient() {
	try {
		return createServiceClient();
	} catch {
		return null;
	}
}

/** Email and invite status. Read with the service role; missing setup just hides them. */
async function readInviteState(clientId: string): Promise<InviteState | null> {
	const admin = serviceClient();
	return admin ? inviteState(admin, clientId).catch(() => null) : null;
}

export const load: PageServerLoad = async (event) => {
	const clientId = event.params.id;
	if (!isUuid(clientId)) {
		await requireAdmin(event);
		error(404, 'Client not found.');
	}

	// Everything loads in one round: the admin check runs alongside the queries (RLS still limits
	// what a non-admin could read, and a failed check discards the results).
	const supabase = event.locals.supabase;
	const [, profileResult, program, conversation, progress, templates, latest, invite] =
		await Promise.all([
			requireAdmin(event),
			supabase
				.from('client_profiles')
				.select('id, display_name, coaching_mode, created_at, archived_at')
				.eq('id', clientId)
				.maybeSingle(),
			loadActiveProgram(supabase, clientId),
			loadConversationCounts(supabase, clientId),
			loadProgress(supabase, clientId, new Date().toISOString().slice(0, 10)),
			// Only active (non-archived) library templates can be assigned.
			listAssignable(supabase),
			supabase
				.from('assessments')
				.select('id, status, answers, red_flags, created_at, ai_recommendations(explanation)')
				.eq('client_id', clientId)
				.order('created_at', { ascending: false })
				.limit(1)
				.maybeSingle(),
			readInviteState(clientId)
		]);
	const { data: profile, error: profileError } = profileResult;
	if (profileError) error(500, 'The client could not be loaded.');
	if (!profile) error(404, 'Client not found.');

	const assessment = latest.data;

	return {
		client: profile,
		invite,
		program,
		conversation,
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

	rename: async (event) => {
		requireSameOrigin(event);
		await requireAdmin(event);
		const clientId = event.params.id;
		const name = cleanText((await event.request.formData()).get('display_name'), nameLimit);
		if (!isUuid(clientId)) return fail(404, { message: 'Client not found.' });
		if (!name) return fail(400, { message: `Enter a name of up to ${nameLimit} characters.` });

		const { error: renameError } = await event.locals.supabase
			.from('client_profiles')
			.update({ display_name: name })
			.eq('id', clientId);
		if (renameError) return fail(400, { message: 'The name could not be saved. Try again.' });
		return { updated: 'rename' };
	},

	archive: async (event) => {
		requireSameOrigin(event);
		await requireAdmin(event);
		const clientId = event.params.id;
		const archive = (await event.request.formData()).get('archive') === '1';
		if (!isUuid(clientId)) return fail(404, { message: 'Client not found.' });

		const { error: archiveError } = await event.locals.supabase
			.from('client_profiles')
			.update({ archived_at: archive ? new Date().toISOString() : null })
			.eq('id', clientId);
		if (archiveError) return fail(400, { message: 'The client could not be updated. Try again.' });
		return { updated: archive ? 'archive' : 'restore' };
	},

	resend: async (event) => {
		requireSameOrigin(event);
		await requireAdmin(event);
		const clientId = event.params.id;
		if (!isUuid(clientId)) return fail(404, { message: 'Client not found.' });
		const admin = serviceClient();
		if (!admin)
			return fail(503, {
				message: 'Invitations are not set up yet. Add the service-role secret in Netlify.'
			});

		const result = await resendInvite(
			admin,
			clientId,
			new URL('/account/accept-invite', event.url.origin).href
		);
		if (!result.ok) return fail(400, { message: result.message });
		return { updated: 'resend' };
	},

	delete: async (event) => {
		requireSameOrigin(event);
		await requireAdmin(event);
		const clientId = event.params.id;
		if (!isUuid(clientId)) return fail(404, { message: 'Client not found.' });
		// Check the secret first, so coaching data is never removed while the login is left behind.
		const admin = serviceClient();
		if (!admin)
			return fail(503, {
				message: 'Deleting clients needs the service-role secret in Netlify.'
			});

		const { error: deleteError } = await event.locals.supabase.rpc('delete_client', {
			p_client_id: clientId
		});
		if (deleteError)
			return fail(400, {
				message:
					deleteError.code === '22023'
						? deleteError.message
						: 'The client could not be deleted. Try again.'
			});
		const { error: authError } = await admin.auth.admin.deleteUser(clientId);
		if (authError)
			console.error('Client data was deleted but the login could not be removed', {
				clientId,
				code: authError.code
			});
		redirect(303, '/admin/clients?deleted=1');
	}
} satisfies Actions;

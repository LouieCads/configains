import type { SupabaseClient } from '@supabase/supabase-js';
import { loadCoachingThread } from './human';
import { loadTargets, loadWeekSnapshot } from './progress';
import { loadActiveProgram } from './templates';

/**
 * What each client page loads, keyed by client id. The client's own pages (`/app`) and the coach's
 * read-only preview (`/admin/view/[id]`) both call these, so the preview can never drift from what
 * the client sees. Row-level security decides whose rows come back: a client reads their own, a
 * coach reads any client's. Nothing here writes.
 */

type Profile = { display_name: string | null; coaching_mode: string };

const inProgress = ['submitted', 'needs_human_review', 'human_assigned'];

async function latestAssessmentStatus(supabase: SupabaseClient, clientId: string) {
	const { data } = await supabase
		.from('assessments')
		.select('status')
		.eq('client_id', clientId)
		.order('created_at', { ascending: false })
		.limit(1)
		.maybeSingle();
	return (data?.status as string | undefined) ?? null;
}

export async function loadClientHome(supabase: SupabaseClient, clientId: string, profile: Profile) {
	const today = new Date().toISOString().slice(0, 10);
	const [program, assessmentStatus, snapshot] = await Promise.all([
		loadActiveProgram(supabase, clientId),
		latestAssessmentStatus(supabase, clientId),
		// The week's targets and entries are extra to the program. If they cannot be read, the page still
		// shows the program rather than failing.
		loadWeekSnapshot(supabase, clientId, today).catch((error) => {
			console.error('Could not load the weekly snapshot', {
				code: (error as { code?: string })?.code
			});
			return null;
		})
	]);

	return {
		displayName: profile.display_name,
		coachingMode: profile.coaching_mode,
		program,
		assessmentStatus,
		snapshot,
		today
	};
}

export async function loadClientCoach(
	supabase: SupabaseClient,
	clientId: string,
	profile: Profile
) {
	const [program, thread] = await Promise.all([
		loadActiveProgram(supabase, clientId),
		loadCoachingThread(supabase, clientId)
	]);
	return { ...thread, programId: program?.id ?? null, displayName: profile.display_name };
}

/** The plan and targets the logging page shows. The client's browser fetches these from the API. */
export async function loadClientLog(supabase: SupabaseClient, clientId: string) {
	const [program, targets] = await Promise.all([
		loadActiveProgram(supabase, clientId),
		loadTargets(supabase, clientId).catch(() => null)
	]);
	return { program, targets };
}

/**
 * True when there is nothing left for the client to answer: they have a program, or their answers are
 * already under review. The assessment page then sends them back to their plan.
 */
export async function assessmentIsDone(supabase: SupabaseClient, clientId: string) {
	const [{ data: active }, status] = await Promise.all([
		supabase
			.from('client_programs')
			.select('id')
			.eq('client_id', clientId)
			.eq('status', 'active')
			.maybeSingle(),
		latestAssessmentStatus(supabase, clientId)
	]);
	return Boolean(active) || inProgress.includes(status as string);
}

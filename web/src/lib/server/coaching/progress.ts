import type { SupabaseClient } from '@supabase/supabase-js';
import { monthlySummary, weeklySummary } from '$lib/coaching/progress';
import type { SyncItem, SyncResult } from '$lib/coaching/sync';
import type { CardioRow, StepRow } from '$lib/coaching/dashboard';
import { targetColumns, targetsFromRow, type ClientTargets } from '$lib/coaching/targets';

export type WorkoutRecord = {
	id: string;
	logged_on: string;
	completed: boolean;
	duration_minutes: number | null;
	notes: string | null;
	entries: {
		name: string;
		sets: number | null;
		reps: string | null;
		load_kg: number | null;
		completed: boolean;
	}[];
};

export type MetricRecord = { id: string; metric: string; value: number; measured_on: string };

export type StepRecord = StepRow & { id: string };
export type CardioRecord = CardioRow & { id: string };

const historyDays = 180;

function sinceDate(today: string) {
	return new Date(Date.parse(`${today}T00:00:00Z`) - historyDays * 86_400_000)
		.toISOString()
		.slice(0, 10);
}

/** Recent logs and metrics for one client, plus weekly and monthly summaries. Row-level security scopes the rows. */
export async function loadProgress(supabase: SupabaseClient, clientId: string, today: string) {
	const since = sinceDate(today);
	const [logsResult, metricsResult] = await Promise.all([
		supabase
			.from('workout_logs')
			.select('id, logged_on, completed, duration_minutes, notes, entries')
			.eq('client_id', clientId)
			.gte('logged_on', since)
			.order('logged_on', { ascending: false })
			.limit(500),
		supabase
			.from('progress_metrics')
			.select('id, metric, value, measured_on')
			.eq('client_id', clientId)
			.gte('measured_on', since)
			.order('measured_on', { ascending: false })
			.limit(500)
	]);
	if (logsResult.error) throw logsResult.error;
	if (metricsResult.error) throw metricsResult.error;

	const logs = (logsResult.data ?? []) as WorkoutRecord[];
	// numeric columns can arrive as strings, so convert before summarising.
	const metrics = ((metricsResult.data ?? []) as MetricRecord[]).map((row) => ({
		...row,
		value: Number(row.value)
	}));

	return {
		logs,
		metrics,
		weekly: weeklySummary(logs, metrics, today, 12),
		monthly: monthlySummary(logs, metrics, today, 6)
	};
}

/** The coach's targets for one client. Missing or partly filled rows come back with every field present. */
export async function loadTargets(supabase: SupabaseClient, clientId: string) {
	const { data, error } = await supabase
		.from('client_targets')
		.select(targetColumns)
		.eq('client_id', clientId)
		.maybeSingle();
	if (error) throw error;
	return targetsFromRow(data as Partial<ClientTargets> | null);
}

/**
 * Saves part of a client's targets (the activity fields or the nutrition fields). Only the fields
 * given are changed, so saving one form never clears the other. Only the coach can write them.
 */
export async function saveTargets(
	supabase: SupabaseClient,
	clientId: string,
	values: Partial<ClientTargets>
) {
	const { error } = await supabase
		.from('client_targets')
		.upsert({ client_id: clientId, ...values }, { onConflict: 'client_id' });
	if (!error) return { ok: true as const };
	return {
		ok: false as const,
		message:
			error.code === '23503'
				? 'Client not found.'
				: 'The targets could not be saved. Check the values and try again.'
	};
}

/**
 * Everything the progress dashboard draws, for one client: workouts and measurements (with the
 * weekly and monthly summaries), daily steps, cardio sessions and the coach's targets.
 * Row-level security scopes every query, so a client only ever gets their own rows.
 */
export async function loadDashboard(supabase: SupabaseClient, clientId: string, today: string) {
	const since = sinceDate(today);
	const [progress, stepsResult, cardioResult, targets] = await Promise.all([
		loadProgress(supabase, clientId, today),
		supabase
			.from('step_logs')
			.select('id, logged_on, steps, created_at')
			.eq('client_id', clientId)
			.gte('logged_on', since)
			.order('logged_on', { ascending: false })
			.limit(500),
		supabase
			.from('cardio_logs')
			.select('id, logged_on, duration_minutes, avg_heart_rate, activity')
			.eq('client_id', clientId)
			.gte('logged_on', since)
			.order('logged_on', { ascending: false })
			.limit(500),
		loadTargets(supabase, clientId)
	]);
	if (stepsResult.error) throw stepsResult.error;
	if (cardioResult.error) throw cardioResult.error;

	return {
		...progress,
		steps: (stepsResult.data ?? []) as StepRecord[],
		cardio: (cardioResult.data ?? []) as CardioRecord[],
		targets
	};
}

/**
 * A light read for the client's home page: just this and last week's steps, cardio and workouts
 * (enough for "this week"), plus the coach's targets. Row-level security scopes every query.
 */
export async function loadWeekSnapshot(supabase: SupabaseClient, clientId: string, today: string) {
	const since = new Date(Date.parse(`${today}T00:00:00Z`) - 14 * 86_400_000)
		.toISOString()
		.slice(0, 10);
	const [stepsResult, cardioResult, logsResult, targets] = await Promise.all([
		supabase
			.from('step_logs')
			.select('id, logged_on, steps, created_at')
			.eq('client_id', clientId)
			.gte('logged_on', since)
			.limit(200),
		supabase
			.from('cardio_logs')
			.select('id, logged_on, duration_minutes, avg_heart_rate, activity')
			.eq('client_id', clientId)
			.gte('logged_on', since)
			.limit(200),
		supabase
			.from('workout_logs')
			.select('id, logged_on, completed, duration_minutes, entries')
			.eq('client_id', clientId)
			.gte('logged_on', since)
			.limit(200),
		loadTargets(supabase, clientId)
	]);
	if (stepsResult.error) throw stepsResult.error;
	if (cardioResult.error) throw cardioResult.error;
	if (logsResult.error) throw logsResult.error;

	return {
		steps: (stepsResult.data ?? []) as StepRecord[],
		cardio: (cardioResult.data ?? []) as CardioRecord[],
		logs: (logsResult.data ?? []) as Pick<
			WorkoutRecord,
			'id' | 'logged_on' | 'completed' | 'duration_minutes' | 'entries'
		>[],
		targets
	};
}

// Database errors that mean the entry itself is wrong. Anything else is treated as temporary so the client retries.
const rejectingCodes = new Set(['23514', '23503', '22P02', '22007', '22008', '42501']);

function resultFor(id: string, error: { code?: string; message: string } | null): SyncResult {
	if (!error) return { id, status: 'saved' };
	if (error.code === '23505') return { id, status: 'duplicate' };
	if (error.code && rejectingCodes.has(error.code))
		return {
			id,
			status: 'rejected',
			message: 'This entry could not be saved. Check it and try again.'
		};
	throw error;
}

/**
 * Writes validated items. Rows are only inserted, never updated, so a retry or a second device
 * cannot overwrite an entry that is already on the server.
 */
export async function saveSyncItems(
	supabase: SupabaseClient,
	clientId: string,
	programId: string | null,
	validPhaseIds: Set<string>,
	items: SyncItem[]
): Promise<SyncResult[]> {
	const results: SyncResult[] = [];
	for (const item of items) {
		if (item.kind === 'workout') {
			if (item.phase_id && !validPhaseIds.has(item.phase_id)) {
				results.push({
					id: item.id,
					status: 'rejected',
					message: 'That phase is not part of your current workout.'
				});
				continue;
			}
			const { error } = await supabase.from('workout_logs').insert({
				id: item.id,
				client_id: clientId,
				client_program_id: programId,
				phase_id: item.phase_id,
				logged_on: item.logged_on,
				completed: item.completed,
				duration_minutes: item.duration_minutes,
				notes: item.notes,
				entries: item.entries
			});
			results.push(resultFor(item.id, error));
		} else if (item.kind === 'steps') {
			const { error } = await supabase.from('step_logs').insert({
				id: item.id,
				client_id: clientId,
				logged_on: item.logged_on,
				steps: item.steps
			});
			results.push(resultFor(item.id, error));
		} else if (item.kind === 'cardio') {
			const { error } = await supabase.from('cardio_logs').insert({
				id: item.id,
				client_id: clientId,
				logged_on: item.logged_on,
				duration_minutes: item.duration_minutes,
				avg_heart_rate: item.avg_heart_rate,
				activity: item.activity
			});
			results.push(resultFor(item.id, error));
		} else {
			const { error } = await supabase.from('progress_metrics').insert({
				id: item.id,
				client_id: clientId,
				metric: item.metric,
				value: item.value,
				measured_on: item.measured_on
			});
			results.push(resultFor(item.id, error));
		}
	}
	return results;
}

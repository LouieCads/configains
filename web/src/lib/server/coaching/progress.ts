import type { SupabaseClient } from '@supabase/supabase-js';
import { monthlySummary, weeklySummary } from '$lib/coaching/progress';
import type { SyncItem, SyncResult } from '$lib/coaching/sync';

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

const historyDays = 180;

/** Recent logs and metrics for one client, plus weekly and monthly summaries. Row-level security scopes the rows. */
export async function loadProgress(supabase: SupabaseClient, clientId: string, today: string) {
	const since = new Date(Date.parse(`${today}T00:00:00Z`) - historyDays * 86_400_000)
		.toISOString()
		.slice(0, 10);
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

import { isUuid } from './text';
import { progressMetrics, type MetricKey } from './progress';

export type EntryInput = {
	exercise_id: string | null;
	name: string;
	sets: number | null;
	reps: string | null;
	load_kg: number | null;
	completed: boolean;
};

export type WorkoutItem = {
	kind: 'workout';
	id: string;
	logged_on: string;
	completed: boolean;
	duration_minutes: number | null;
	notes: string | null;
	phase_id: string | null;
	entries: EntryInput[];
};

export type MetricItem = {
	kind: 'metric';
	id: string;
	metric: MetricKey;
	value: number;
	measured_on: string;
};

export type SyncItem = WorkoutItem | MetricItem;

/** One result per item. A duplicate means the server already has this id, so the item counts as synced. */
export type SyncResult = {
	id: string;
	status: 'saved' | 'duplicate' | 'rejected';
	message?: string;
};

const maxEntries = 60;
const maxAgeDays = 400;

function fail(message: string): { ok: false; message: string } {
	return { ok: false, message };
}

function isoDay(value: unknown, today: string): string | null {
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
	const date = new Date(`${value}T00:00:00Z`);
	if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
	const earliest = new Date(`${today}T00:00:00Z`).getTime() - maxAgeDays * 86_400_000;
	const latest = new Date(`${today}T00:00:00Z`).getTime() + 86_400_000;
	if (date.getTime() < earliest || date.getTime() > latest) return null;
	return value;
}

function optionalNumber(value: unknown, min: number, max: number): number | null | undefined {
	if (value === null || value === undefined || value === '') return null;
	const number = typeof value === 'number' ? value : Number(value);
	if (!Number.isFinite(number) || number < min || number > max) return undefined;
	return number;
}

function optionalText(value: unknown, max: number): string | null | undefined {
	if (value === null || value === undefined || value === '') return null;
	if (typeof value !== 'string' || value.length > max) return undefined;
	return value.trim() || null;
}

function entryFrom(raw: unknown): EntryInput | string {
	const entry = (raw ?? {}) as Record<string, unknown>;
	const name = optionalText(entry.name, 120);
	if (!name) return 'Each exercise needs a name of up to 120 characters.';
	const sets = optionalNumber(entry.sets, 0, 50);
	const load = optionalNumber(entry.load_kg, 0, 1000);
	const reps = optionalText(entry.reps, 40);
	if (sets === undefined || load === undefined || reps === undefined)
		return 'Exercise sets, reps or load are out of range.';
	const exerciseId =
		entry.exercise_id === null || entry.exercise_id === undefined ? null : entry.exercise_id;
	if (exerciseId !== null && !isUuid(exerciseId)) return 'An exercise id is not valid.';
	return {
		exercise_id: exerciseId as string | null,
		name,
		sets: sets === null ? null : Math.round(sets),
		reps,
		load_kg: load,
		completed: entry.completed !== false
	};
}

/** Checks one item from the offline outbox before it is written. Nothing here trusts client-side checks. */
export function validateSyncItem(
	raw: unknown,
	today: string
): { ok: true; value: SyncItem } | { ok: false; message: string } {
	if (!raw || typeof raw !== 'object') return fail('The item could not be read.');
	const item = raw as Record<string, unknown>;
	if (!isUuid(item.id)) return fail('The item id is not valid.');

	if (item.kind === 'metric') {
		const metric = progressMetrics.find((option) => option.key === item.metric);
		if (!metric) return fail('Choose a metric from the list.');
		const value = optionalNumber(item.value, metric.min, metric.max);
		if (value === null || value === undefined)
			return fail(
				`${metric.label} must be between ${metric.min} and ${metric.max} ${metric.unit}.`
			);
		const measuredOn = isoDay(item.measured_on, today);
		if (!measuredOn) return fail('The measurement date is not valid.');
		return {
			ok: true,
			value: { kind: 'metric', id: item.id, metric: metric.key, value, measured_on: measuredOn }
		};
	}

	if (item.kind === 'workout') {
		const loggedOn = isoDay(item.logged_on, today);
		if (!loggedOn) return fail('The workout date is not valid.');
		const duration = optionalNumber(item.duration_minutes, 0, 600);
		if (duration === undefined) return fail('Duration must be between 0 and 600 minutes.');
		const notes = optionalText(item.notes, 1000);
		if (notes === undefined) return fail('Notes must be 1000 characters or fewer.');
		if (item.phase_id !== undefined && item.phase_id !== null && !isUuid(item.phase_id))
			return fail('The workout phase is not valid.');
		if (!Array.isArray(item.entries) || item.entries.length > maxEntries)
			return fail(`A workout can have up to ${maxEntries} exercises.`);

		const entries: EntryInput[] = [];
		for (const rawEntry of item.entries) {
			const entry = entryFrom(rawEntry);
			if (typeof entry === 'string') return fail(entry);
			entries.push(entry);
		}
		return {
			ok: true,
			value: {
				kind: 'workout',
				id: item.id,
				logged_on: loggedOn,
				completed: item.completed !== false,
				duration_minutes: duration === null ? null : Math.round(duration),
				notes,
				phase_id: (item.phase_id as string | null | undefined) ?? null,
				entries
			}
		};
	}

	return fail('The item type is not recognised.');
}

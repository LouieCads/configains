import { describe, expect, it } from 'vitest';
import { validateSyncItem } from './sync';

const today = '2026-10-10';
const id = '15000000-0000-0000-0000-000000000001';

const workout = {
	kind: 'workout',
	id,
	logged_on: today,
	completed: true,
	duration_minutes: 45,
	notes: '  Felt good  ',
	phase_id: null,
	entries: [{ exercise_id: null, name: 'Squat', sets: 3, reps: '8', load_kg: 40, completed: true }]
};

describe('validateSyncItem', () => {
	it('accepts a workout and trims notes', () => {
		const result = validateSyncItem(workout, today);
		expect(result).toMatchObject({ ok: true, value: { kind: 'workout', notes: 'Felt good' } });
	});

	it('accepts a metric within the agreed range', () => {
		expect(
			validateSyncItem(
				{ kind: 'metric', id, metric: 'body_weight_kg', value: 79.5, measured_on: today },
				today
			)
		).toMatchObject({ ok: true, value: { metric: 'body_weight_kg', value: 79.5 } });
	});

	it('accepts a daily step count', () => {
		expect(validateSyncItem({ kind: 'steps', id, logged_on: today, steps: 8123 }, today)).toEqual({
			ok: true,
			value: { kind: 'steps', id, logged_on: today, steps: 8123 }
		});
	});

	it('accepts a cardio session with only the minutes, or with every field', () => {
		expect(
			validateSyncItem({ kind: 'cardio', id, logged_on: today, duration_minutes: 30 }, today)
		).toEqual({
			ok: true,
			value: {
				kind: 'cardio',
				id,
				logged_on: today,
				duration_minutes: 30,
				avg_heart_rate: null,
				activity: null
			}
		});
		expect(
			validateSyncItem(
				{
					kind: 'cardio',
					id,
					logged_on: today,
					duration_minutes: 32.4,
					avg_heart_rate: '145',
					activity: '  Bike  '
				},
				today
			)
		).toMatchObject({
			ok: true,
			value: { duration_minutes: 32, avg_heart_rate: 145, activity: 'Bike' }
		});
	});

	it.each([
		[
			{ kind: 'steps', id, logged_on: today, steps: -1 },
			'Steps must be a whole number between 0 and 200,000.'
		],
		[
			{ kind: 'steps', id, logged_on: today, steps: 250000 },
			'Steps must be a whole number between 0 and 200,000.'
		],
		[
			{ kind: 'steps', id, logged_on: today, steps: '' },
			'Steps must be a whole number between 0 and 200,000.'
		],
		[
			{ kind: 'steps', id, logged_on: '2030-01-01', steps: 5000 },
			'The step count date is not valid.'
		],
		[
			{ kind: 'cardio', id, logged_on: today, duration_minutes: 0 },
			'Cardio time must be between 1 and 600 minutes.'
		],
		[{ kind: 'cardio', id, logged_on: today }, 'Cardio time must be between 1 and 600 minutes.'],
		[
			{ kind: 'cardio', id, logged_on: today, duration_minutes: 30, avg_heart_rate: 400 },
			'Average heart rate must be between 30 and 250 BPM.'
		],
		[
			{ kind: 'cardio', id, logged_on: today, duration_minutes: 30, activity: 'x'.repeat(61) },
			'The cardio type must be 60 characters or fewer.'
		],
		[
			{ kind: 'cardio', id, logged_on: 'yesterday', duration_minutes: 30 },
			'The cardio date is not valid.'
		]
	])('rejects a bad step or cardio entry (case %#)', (input, message) => {
		expect(validateSyncItem(input, today)).toEqual({ ok: false, message });
	});

	it.each([
		[{ ...workout, id: 'not-a-uuid' }, 'The item id is not valid.'],
		[{ ...workout, logged_on: '2026-02-30' }, 'The workout date is not valid.'],
		[{ ...workout, logged_on: '2030-01-01' }, 'The workout date is not valid.'],
		[{ ...workout, duration_minutes: 900 }, 'Duration must be between 0 and 600 minutes.'],
		[
			{ ...workout, entries: [{ ...workout.entries[0], name: '' }] },
			'Each exercise needs a name of up to 120 characters.'
		],
		[
			{ ...workout, entries: [{ ...workout.entries[0], load_kg: -5 }] },
			'Exercise sets, reps or load are out of range.'
		],
		[
			{ ...workout, entries: [{ ...workout.entries[0], exercise_id: 'bad' }] },
			'An exercise id is not valid.'
		],
		[
			{ kind: 'metric', id, metric: 'body_fat', value: 20, measured_on: today },
			'Choose a metric from the list.'
		],
		[
			{ kind: 'metric', id, metric: 'waist_cm', value: 500, measured_on: today },
			'Waist must be between 30 and 200 cm.'
		],
		[{ kind: 'sleep', id }, 'The item type is not recognised.']
	])('rejects bad input with a clear message (case %#)', (input, message) => {
		expect(validateSyncItem(input, today)).toEqual({ ok: false, message });
	});

	it('refuses to read a non-object', () => {
		expect(validateSyncItem('workout', today)).toEqual({
			ok: false,
			message: 'The item could not be read.'
		});
	});
});

import { describe, expect, it } from 'vitest';
import {
	asLibraryTemplate,
	prescription,
	repsSummary,
	setTargets,
	validateTemplate
} from './template';

const phase = {
	name: 'Week 1',
	instructions: 'Keep rest honest.',
	exercises: [{ name: 'Goblet squat', sets: 3, reps: '8-10', rest_seconds: 90, notes: '' }]
};

const workout = { kind: 'workout', goal: 'fat_loss', name: 'Foundations', phases: [phase] };

describe('validateTemplate', () => {
	it('accepts a workout and trims text, keeping blank optional fields empty', () => {
		const result = validateTemplate({ ...workout, name: '  Foundations  ' });
		expect(result).toMatchObject({ ok: true });
		if (!result.ok) return;
		expect(result.value.name).toBe('Foundations');
		expect(result.value.phases[0].exercises[0].notes).toBeNull();
		expect(result.value.phases[0].exercises[0].sets).toBe(3);
	});

	it('keeps existing record ids and rejects malformed ids', () => {
		const id = '11111111-2222-3333-4444-555555555555';
		const ok = validateTemplate({ ...workout, id, phases: [{ ...phase, id }] });
		expect(ok).toMatchObject({ ok: true, value: { id } });
		expect(validateTemplate({ ...workout, id: 'not-a-uuid' })).toEqual({
			ok: false,
			message: 'Template is not valid.'
		});
	});

	it.each([
		[{ ...workout, name: '   ' }, 'Name is required.'],
		[{ ...workout, kind: 'supplement' }, 'Choose a workout or nutrition template.'],
		[{ ...workout, goal: 'bulk' }, 'Choose a goal.'],
		[{ ...workout, phases: [] }, 'Add at least one phase.'],
		[{ ...workout, phases: [{ ...phase, name: '' }] }, 'Phase 1 name is required.'],
		[
			{ ...workout, phases: [{ ...phase, exercises: [{ ...phase.exercises[0], name: '' }] }] },
			'Phase 1, exercise 1 name is required.'
		],
		[
			{ ...workout, phases: [{ ...phase, exercises: [{ ...phase.exercises[0], sets: 0 }] }] },
			'Phase 1, exercise 1 sets must be a whole number from 1 to 20.'
		],
		[
			{
				...workout,
				phases: [{ ...phase, exercises: [{ ...phase.exercises[0], rest_seconds: 1.5 }] }]
			},
			'Phase 1, exercise 1 rest must be a whole number from 0 to 900.'
		],
		[{ ...workout, description: 'x'.repeat(1001) }, 'Description must be 1000 characters or fewer.']
	])('rejects invalid input with a clear message (case %#)', (input, message) => {
		expect(validateTemplate(input)).toEqual({ ok: false, message });
	});

	it('rejects unreadable input without throwing', () => {
		expect(validateTemplate(null)).toEqual({
			ok: false,
			message: 'The template could not be read.'
		});
		expect(validateTemplate('workout')).toEqual({
			ok: false,
			message: 'The template could not be read.'
		});
	});
});

describe('RIR and per-set targets', () => {
	const exercise = (extra: Record<string, unknown>) =>
		validateTemplate({
			...workout,
			phases: [{ ...phase, duration_weeks: 4, exercises: [{ ...phase.exercises[0], ...extra }] }]
		});

	it('keeps one RIR for every set and the phase length', () => {
		const result = exercise({ rir: ' 2 ' });
		if (!result.ok) throw new Error(result.message);
		expect(result.value.phases[0].duration_weeks).toBe(4);
		expect(result.value.phases[0].exercises[0]).toMatchObject({ rir: '2', set_plan: [] });
	});

	it('stores a varied plan, with sets taken from the plan and a reps summary', () => {
		const set_plan = [
			{ reps: '6-10', rir: '2' },
			{ reps: '8-12', rir: '1' },
			{ reps: '8-12', rir: '1' }
		];
		const result = exercise({ sets: 5, set_plan });
		if (!result.ok) throw new Error(result.message);
		expect(result.value.phases[0].exercises[0]).toMatchObject({
			sets: 3,
			reps: '6-10, 8-12 x2',
			rir: null,
			set_plan
		});
	});

	it('folds a plan where every set is the same back into plain sets', () => {
		const result = exercise({
			set_plan: [
				{ reps: '10', rir: '2' },
				{ reps: '10', rir: '2' }
			]
		});
		if (!result.ok) throw new Error(result.message);
		expect(result.value.phases[0].exercises[0]).toMatchObject({
			sets: 2,
			reps: '10',
			rir: '2',
			set_plan: []
		});
	});

	it('rejects long RIR text, too many sets and impossible phase lengths', () => {
		expect(exercise({ rir: '12345678901' }).ok).toBe(false);
		expect(exercise({ set_plan: Array.from({ length: 21 }, () => ({ reps: '5' })) }).ok).toBe(
			false
		);
		expect(validateTemplate({ ...workout, phases: [{ ...phase, duration_weeks: 0 }] }).ok).toBe(
			false
		);
	});

	it('describes an exercise in one line', () => {
		expect(prescription({ sets: 3, reps: '8-10', rir: '2', set_plan: [], rest_seconds: 90 })).toBe(
			'3 sets, 8-10 reps, RIR 2, 90s rest'
		);
		expect(
			prescription({
				sets: 2,
				reps: 'x',
				rir: null,
				set_plan: [
					{ reps: '5', rir: null },
					{ reps: '8', rir: null }
				],
				rest_seconds: null
			})
		).toBe('2 sets');
		expect(setTargets({ sets: 2, reps: '10', rir: '1', set_plan: [] })).toEqual([
			{ reps: '10', rir: '1' },
			{ reps: '10', rir: '1' }
		]);
		expect(repsSummary([{ reps: null, rir: '1' }])).toBeNull();
	});
});

describe('asLibraryTemplate', () => {
	it('drops every row id and archiving, and renames the copy', () => {
		const id = '11111111-2222-3333-4444-555555555555';
		const result = validateTemplate({
			...workout,
			id,
			is_archived: true,
			phases: [{ ...phase, id, exercises: [{ ...phase.exercises[0], id }] }]
		});
		if (!result.ok) throw new Error(result.message);
		const copy = asLibraryTemplate(result.value, 'Strength for Sam');
		expect(copy).toMatchObject({ id: undefined, name: 'Strength for Sam', is_archived: false });
		expect(copy.phases[0].id).toBeUndefined();
		expect(copy.phases[0].exercises[0].id).toBeUndefined();
		expect(result.value.phases[0].id).toBe(id);
	});
});

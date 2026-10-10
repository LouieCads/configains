import { describe, expect, it } from 'vitest';
import { validateTemplate } from './template';

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

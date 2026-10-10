import { describe, expect, it } from 'vitest';
import { validateAssessment } from './assessment';

const base = {
	goal: 'fat_loss',
	experience: 'beginner',
	training_location: 'home',
	days_per_week: '3',
	sex: 'female',
	health: ['none']
};

describe('validateAssessment', () => {
	it('accepts a complete answer set and converts the day count to a number', () => {
		const result = validateAssessment(base);
		expect(result).toMatchObject({
			ok: true,
			redFlags: [],
			value: { days_per_week: 3, health: [] }
		});
	});

	it('routes any health flag to personal review, keeping the flags', () => {
		const result = validateAssessment({ ...base, health: ['injury', 'injury', 'pregnancy'] });
		expect(result).toMatchObject({ ok: true, redFlags: ['injury', 'pregnancy'] });
	});

	it.each([
		[{ ...base, goal: 'bulk' }, 'Choose your main goal.'],
		[{ ...base, experience: 'expert' }, 'Choose your training experience.'],
		[{ ...base, training_location: 'pool' }, 'Choose where you will train.'],
		[{ ...base, days_per_week: '7' }, 'Choose how many days a week you can train.'],
		[{ ...base, days_per_week: '2.5' }, 'Choose how many days a week you can train.'],
		[{ ...base, sex: undefined }, 'Choose a program variant, or prefer not to say.'],
		[
			{ ...base, health: ['none', 'injury'] },
			'Check the health options that apply, or choose none on its own.'
		],
		[
			{ ...base, health: ['made_up'] },
			'Check the health options that apply, or choose none on its own.'
		]
	])('rejects bad input with a clear message (case %#)', (input, message) => {
		expect(validateAssessment(input)).toEqual({ ok: false, message });
	});

	it('lets a client decline to say which program variant fits', () => {
		expect(validateAssessment({ ...base, sex: 'prefer_not_to_say' })).toMatchObject({ ok: true });
	});
});

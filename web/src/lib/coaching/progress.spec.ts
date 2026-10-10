import { describe, expect, it } from 'vitest';
import { monthlySummary, weekStart, weeklySummary } from './progress';

describe('weekStart', () => {
	it('returns the Monday of the week, including on a Sunday', () => {
		expect(weekStart('2026-10-10')).toBe('2026-10-05'); // Saturday
		expect(weekStart('2026-10-11')).toBe('2026-10-05'); // Sunday
		expect(weekStart('2026-10-05')).toBe('2026-10-05'); // Monday
	});
});

describe('weeklySummary', () => {
	const today = '2026-10-10';

	it('counts completed workouts only and averages metrics per week, newest first', () => {
		const result = weeklySummary(
			[
				{ logged_on: '2026-10-06', completed: true },
				{ logged_on: '2026-10-07', completed: false },
				{ logged_on: '2026-09-30', completed: true }
			],
			[
				{ metric: 'body_weight_kg', value: 80, measured_on: '2026-10-05' },
				{ metric: 'body_weight_kg', value: 81, measured_on: '2026-10-09' },
				{ metric: 'body_weight_kg', value: 79.6, measured_on: '2026-09-30' }
			],
			today,
			3
		);

		expect(result.map((week) => week.key)).toEqual(['2026-10-05', '2026-09-28', '2026-09-21']);
		expect(result[0]).toEqual({
			key: '2026-10-05',
			workouts: 1,
			averages: { body_weight_kg: 80.5 }
		});
		expect(result[1]).toEqual({
			key: '2026-09-28',
			workouts: 1,
			averages: { body_weight_kg: 79.6 }
		});
		expect(result[2]).toEqual({ key: '2026-09-21', workouts: 0, averages: {} });
	});
});

describe('monthlySummary', () => {
	it('handles a 31st without rolling into the wrong month', () => {
		const result = monthlySummary([], [], '2026-03-31', 2);
		expect(result.map((month) => month.key)).toEqual(['2026-03', '2026-02']);
	});

	it('averages metrics across the month', () => {
		const result = monthlySummary(
			[{ logged_on: '2026-10-02', completed: true }],
			[
				{ metric: 'waist_cm', value: 82, measured_on: '2026-10-01' },
				{ metric: 'waist_cm', value: 81, measured_on: '2026-10-20' }
			],
			'2026-10-10',
			1
		);
		expect(result).toEqual([{ key: '2026-10', workouts: 1, averages: { waist_cm: 81.5 } }]);
	});
});

import { describe, expect, it } from 'vitest';
import {
	consistency,
	dailySteps,
	estimateStrength,
	fourWeekReview,
	metricTrend,
	parseReps,
	stepDays,
	strengthProgress,
	weekStatus,
	weeklyHistory,
	type CardioRow,
	type DashboardRows,
	type MetricRow,
	type StepRow,
	type WorkoutRow
} from './dashboard';
import { noTargets, type ClientTargets } from './targets';

// Thursday. Its week runs Monday 2026-11-09 to Sunday 2026-11-15.
const today = '2026-11-12';

const targets: ClientTargets = {
	...noTargets,
	daily_steps_target: 8000,
	cardio_minutes: 30,
	cardio_sessions_per_week: 4,
	cardio_hr_min: 140,
	cardio_hr_max: 150
};

let tick = 0;
const step = (logged_on: string, steps: number): StepRow => ({
	logged_on,
	steps,
	// Each call is a minute later than the last, so the order they were logged in is clear.
	created_at: new Date(Date.UTC(2026, 10, 1, 8, tick++)).toISOString()
});
const cardio = (
	logged_on: string,
	duration_minutes: number,
	avg_heart_rate: number | null = null
): CardioRow => ({ logged_on, duration_minutes, avg_heart_rate, activity: null });
const workout = (
	logged_on: string,
	entries: WorkoutRow['entries'] = [],
	completed = true
): WorkoutRow => ({ logged_on, completed, duration_minutes: 45, entries });
const weight = (measured_on: string, value: number): MetricRow => ({
	metric: 'body_weight_kg',
	value,
	measured_on
});
const rows = (partial: Partial<DashboardRows> = {}): DashboardRows => ({
	logs: [],
	metrics: [],
	steps: [],
	cardio: [],
	...partial
});

describe('daily steps', () => {
	it('keeps the newest entry for a day, as a correction', () => {
		const result = dailySteps([step('2026-11-10', 6200), step('2026-11-10', 9100)]);
		expect(result.get('2026-11-10')).toBe(9100);
		expect(result.size).toBe(1);
	});

	it('lists the last days oldest first, marking missing days and the target', () => {
		const days = stepDays([step('2026-11-11', 9000), step('2026-11-12', 4000)], 8000, today, 3);
		expect(days).toEqual([
			{ date: '2026-11-10', steps: null, met: null },
			{ date: '2026-11-11', steps: 9000, met: true },
			{ date: '2026-11-12', steps: 4000, met: false }
		]);
	});

	it('has no met flag without a target', () => {
		expect(stepDays([step('2026-11-12', 4000)], null, today, 1)[0].met).toBeNull();
	});
});

describe('this week', () => {
	const data = rows({
		steps: [
			step('2026-11-08', 20000), // last week: ignored
			step('2026-11-09', 9000),
			step('2026-11-10', 7000),
			step('2026-11-11', 5000),
			step('2026-11-11', 8200) // correction
		],
		cardio: [
			cardio('2026-11-08', 60),
			cardio('2026-11-10', 30, 145),
			cardio('2026-11-11', 20, 160)
		],
		logs: [workout('2026-11-10'), workout('2026-11-11', [], false), workout('2026-11-01')]
	});

	it('counts days on target using the corrected step counts', () => {
		const week = weekStatus(data, targets, today);
		expect(week.start).toBe('2026-11-09');
		expect(week.daysElapsed).toBe(4);
		expect(week.steps).toEqual({
			target: 8000,
			todaySteps: null,
			daysLogged: 3,
			daysOnTarget: 2,
			average: 8067
		});
	});

	it('only counts cardio long enough to meet the requirement, and reports heart rate zone', () => {
		const { cardio: result } = weekStatus(data, targets, today);
		expect(result).toEqual({
			sessions: 2,
			counted: 1,
			minutes: 50,
			inZone: 1,
			requiredSessions: 4
		});
	});

	it('counts only completed workouts this week', () => {
		expect(weekStatus(data, targets, today).workouts).toBe(1);
	});

	it('counts any cardio session when the coach set no minimum', () => {
		const week = weekStatus(data, { ...targets, cardio_minutes: null }, today);
		expect(week.cardio.counted).toBe(2);
	});

	it('works with no targets at all', () => {
		const week = weekStatus(data, null, today);
		expect(week.steps.target).toBeNull();
		expect(week.steps.daysOnTarget).toBe(0);
		expect(week.cardio.requiredSessions).toBeNull();
	});
});

describe('weekly history', () => {
	it('returns the requested weeks oldest first, ending with this week', () => {
		const history = weeklyHistory(
			rows({
				cardio: [cardio('2026-11-03', 35), cardio('2026-11-10', 40)],
				logs: [workout('2026-11-04'), workout('2026-11-05'), workout('2026-11-11')],
				steps: [step('2026-11-03', 8500), step('2026-11-10', 3000)]
			}),
			targets,
			today,
			3
		);
		expect(history.map((week) => week.week)).toEqual(['2026-10-26', '2026-11-02', '2026-11-09']);
		expect(history.map((week) => week.workouts)).toEqual([0, 2, 1]);
		expect(history.map((week) => week.cardioCounted)).toEqual([0, 1, 1]);
		expect(history.map((week) => week.stepDaysOnTarget)).toEqual([0, 1, 0]);
		expect(history.map((week) => week.stepDaysLogged)).toEqual([0, 1, 1]);
	});
});

describe('measurement trends', () => {
	const metrics = [
		weight('2026-10-28', 81),
		weight('2026-11-02', 80),
		weight('2026-11-03', 79.6),
		weight('2026-11-09', 79),
		weight('2026-11-10', 78.6),
		{ metric: 'waist_cm', value: 90, measured_on: '2026-11-10' }
	];

	it('averages the week and compares it with the week before', () => {
		const trend = metricTrend(metrics, 'body_weight_kg', today);
		expect(trend.week).toEqual({ key: '2026-11-09', average: 78.8, change: -1, current: true });
	});

	it('averages the month and compares it with the month before', () => {
		const trend = metricTrend(metrics, 'body_weight_kg', today);
		expect(trend.month).toEqual({ key: '2026-11', average: 79.3, change: -1.7, current: true });
	});

	it('gives one point per day and the overall change', () => {
		const trend = metricTrend(metrics, 'body_weight_kg', today);
		expect(trend.points.map((point) => point.date)).toEqual([
			'2026-10-28',
			'2026-11-02',
			'2026-11-03',
			'2026-11-09',
			'2026-11-10'
		]);
		expect(trend.overall).toEqual({ start: 81, latest: 78.6, change: -2.4, days: 13 });
	});

	it('has no change from a single week, and ignores other metrics and future dates', () => {
		const trend = metricTrend(
			[weight('2026-11-10', 80), weight('2026-11-20', 70), ...metrics.slice(-1)],
			'body_weight_kg',
			today
		);
		expect(trend.week).toEqual({ key: '2026-11-09', average: 80, change: null, current: true });
		expect(trend.overall).toBeNull();
		expect(trend.points).toHaveLength(1);
	});

	it('is empty without measurements', () => {
		const trend = metricTrend([], 'body_weight_kg', today);
		expect(trend.week).toBeNull();
		expect(trend.month).toBeNull();
		expect(trend.points).toEqual([]);
	});

	it('averages several measurements taken on one day', () => {
		const trend = metricTrend(
			[weight('2026-11-10', 80), weight('2026-11-10', 79)],
			'body_weight_kg',
			today
		);
		expect(trend.points).toEqual([{ date: '2026-11-10', value: 79.5 }]);
	});
});

describe('strength', () => {
	it('reads the first number of a reps entry', () => {
		expect(parseReps('8-10')).toBe(8);
		expect(parseReps('12')).toBe(12);
		expect(parseReps('AMRAP')).toBeNull();
		expect(parseReps(null)).toBeNull();
		expect(parseReps('0')).toBeNull();
	});

	it('estimates a one-rep max that rewards more reps at the same load', () => {
		expect(estimateStrength(100, 10)).toBe(133.3);
		expect(estimateStrength(100, 1)).toBe(100);
		expect(estimateStrength(100, null)).toBe(100);
		// Past 12 reps the estimate stops growing.
		expect(estimateStrength(100, 20)).toBe(140);
		expect(estimateStrength(100, 12)).toBe(140);
	});

	const squat = (reps: string, load: number | null, completed = true) => ({
		name: 'Squat',
		sets: 3,
		reps,
		load_kg: load,
		completed
	});

	it('follows each exercise over time and reports the change', () => {
		const [result] = strengthProgress([
			workout('2026-11-09', [squat('8', 105)]),
			workout('2026-11-02', [squat('8', 100)])
		]);
		expect(result.name).toBe('Squat');
		expect(result.sessions.map((session) => session.date)).toEqual(['2026-11-02', '2026-11-09']);
		expect(result.sessions.map((session) => session.strength)).toEqual([126.7, 133]);
		expect(result.change).toEqual({ kg: 6.3, percent: 5 });
	});

	it('skips entries that were not done, have no load, or are in an unfinished session', () => {
		const result = strengthProgress([
			workout('2026-11-02', [squat('8', 100, false), squat('8', null), squat('8', 0)]),
			workout('2026-11-03', [squat('8', 100)], false)
		]);
		expect(result).toEqual([]);
	});

	it('keeps the best set when an exercise appears twice on one day', () => {
		const [result] = strengthProgress([
			workout('2026-11-02', [squat('5', 100), squat('8', 100)]),
			workout('2026-11-09', [squat('8', 110)])
		]);
		expect(result.sessions[0].strength).toBe(126.7);
	});

	it('has no change from one session, and groups names ignoring case', () => {
		const result = strengthProgress([
			workout('2026-11-02', [{ ...squat('8', 100), name: 'squat' }]),
			workout('2026-11-09', [squat('8', 100)])
		]);
		expect(result).toHaveLength(1);
		expect(result[0].sessions).toHaveLength(2);
		expect(strengthProgress([workout('2026-11-02', [squat('8', 100)])])[0].change).toBeNull();
	});

	it('lists the most-logged exercise first', () => {
		const result = strengthProgress([
			workout('2026-11-02', [squat('8', 100), { ...squat('8', 40), name: 'Press' }]),
			workout('2026-11-09', [{ ...squat('8', 42), name: 'Press' }])
		]);
		expect(result.map((exercise) => exercise.name)).toEqual(['Press', 'Squat']);
	});
});

describe('consistency', () => {
	it('does not break a step streak while today is still in progress', () => {
		const data = rows({
			steps: [
				step('2026-11-09', 4000),
				step('2026-11-10', 9000),
				step('2026-11-11', 9000),
				step('2026-11-12', 5000)
			]
		});
		expect(consistency(data, targets, today).stepStreak).toBe(2);
	});

	it('adds today once it reaches the target', () => {
		const data = rows({
			steps: [step('2026-11-11', 9000), step('2026-11-12', 8000)]
		});
		expect(consistency(data, targets, today).stepStreak).toBe(2);
	});

	it('is zero without a step target or after a missed day', () => {
		expect(consistency(rows({ steps: [step('2026-11-12', 9000)] }), null, today).stepStreak).toBe(
			0
		);
		expect(
			consistency(
				rows({ steps: [step('2026-11-10', 9000), step('2026-11-12', 9000)] }),
				targets,
				today
			).stepStreak
		).toBe(1);
	});

	it('counts weeks in a row that met the cardio requirement', () => {
		const week = (day: string, count: number) =>
			Array.from({ length: count }, () => cardio(day, 35));
		const data = rows({
			cardio: [
				...week('2026-11-10', 2), // this week meets 2
				...week('2026-11-03', 2),
				...week('2026-10-27', 1) // short: ends the run
			]
		});
		const required = { ...targets, cardio_sessions_per_week: 2 };
		expect(consistency(data, required, today).cardioWeekStreak).toBe(2);
	});

	it('does not break the cardio run when this week is not finished', () => {
		const data = rows({ cardio: [cardio('2026-11-03', 35), cardio('2026-11-04', 35)] });
		const required = { ...targets, cardio_sessions_per_week: 2 };
		expect(consistency(data, required, today).cardioWeekStreak).toBe(1);
	});
});

describe('four-week review', () => {
	it('sets effort, consistency and results side by side', () => {
		const squat = (load: number) => ({
			name: 'Squat',
			sets: 3,
			reps: '8',
			load_kg: load,
			completed: true
		});
		const review = fourWeekReview(
			rows({
				logs: [workout('2026-10-20', [squat(100)]), workout('2026-11-10', [squat(110)])],
				cardio: [cardio('2026-11-01', 40), cardio('2026-11-02', 10)],
				steps: [step('2026-11-10', 9000), step('2026-11-11', 6000)],
				metrics: [weight('2026-10-20', 82), weight('2026-11-10', 80.5)]
			}),
			targets,
			today
		);
		expect(review.effort).toEqual({ workouts: 2, cardioSessions: 2, averageSteps: 7500 });
		expect(review.consistency).toEqual({
			stepDaysOnTarget: 1,
			stepDays: 28,
			cardioCounted: 1,
			cardioRequired: 16
		});
		expect(review.results.weightChange).toBe(-1.5);
		expect(review.results.topStrength).toEqual({ name: 'Squat', percent: 9.9 });
	});

	it('leaves out what has no target or too little data', () => {
		const review = fourWeekReview(rows(), null, today);
		expect(review.effort.averageSteps).toBeNull();
		expect(review.consistency.stepDaysOnTarget).toBeNull();
		expect(review.consistency.cardioCounted).toBeNull();
		expect(review.results).toEqual({ weightChange: null, weightWeeks: 0, topStrength: null });
	});
});

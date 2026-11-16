// Turns a client's logged workouts, steps, cardio and measurements into what the dashboard shows:
// what they were asked to do, what they did, how consistent they were, and how results moved.
// Pure functions of rows, targets and a date, so they run the same on the server and in the browser.
import { daysBetween, monthKey, shiftDays, weekStart, type MetricKey } from './progress';
import type { ClientTargets } from './targets';

export type StepRow = { logged_on: string; steps: number; created_at: string };
export type CardioRow = {
	logged_on: string;
	duration_minutes: number;
	avg_heart_rate: number | null;
	activity: string | null;
};
export type WorkoutEntryRow = {
	name: string;
	sets: number | null;
	reps: string | null;
	load_kg: number | null;
	completed?: boolean;
};
export type WorkoutRow = {
	logged_on: string;
	completed: boolean;
	duration_minutes: number | null;
	entries: WorkoutEntryRow[];
};
export type MetricRow = { metric: string; value: number; measured_on: string };

export type DashboardRows = {
	logs: WorkoutRow[];
	metrics: MetricRow[];
	steps: StepRow[];
	cardio: CardioRow[];
};

/** Rounded to one decimal, never "-0". */
function oneDecimal(value: number) {
	const rounded = Math.round(value * 10) / 10;
	return Object.is(rounded, -0) ? 0 : rounded;
}

function weeksBack(today: string, count: number) {
	// Oldest first, ending with the week that contains today.
	return Array.from({ length: count }, (_, index) =>
		weekStart(shiftDays(today, -7 * (count - 1 - index)))
	);
}

// ---------------------------------------------------------------------------------------------
// Steps

/** One step count per day. A later entry for the same day replaces an earlier one (a correction). */
export function dailySteps(rows: StepRow[]): Map<string, number> {
	const newest = new Map<string, { steps: number; at: number }>();
	for (const row of rows) {
		const at = Date.parse(row.created_at) || 0;
		const current = newest.get(row.logged_on);
		if (!current || at >= current.at) newest.set(row.logged_on, { steps: Number(row.steps), at });
	}
	return new Map([...newest].map(([day, { steps }]) => [day, steps]));
}

export type StepDay = {
	date: string;
	steps: number | null;
	/** True or false once there is a target and a count; null when either is missing. */
	met: boolean | null;
};

/** The last `days` days ending today, oldest first. A day without an entry has `steps: null`. */
export function stepDays(rows: StepRow[], target: number | null, today: string, days = 14) {
	const byDay = dailySteps(rows);
	return Array.from({ length: days }, (_, index): StepDay => {
		const date = shiftDays(today, -(days - 1 - index));
		const steps = byDay.get(date) ?? null;
		return { date, steps, met: target !== null && steps !== null ? steps >= target : null };
	});
}

// ---------------------------------------------------------------------------------------------
// Cardio

/** A session counts toward the weekly requirement when it lasts at least the target minutes. */
export function countsAsCardio(session: CardioRow, targets: ClientTargets | null) {
	const minimum = targets?.cardio_minutes ?? 0;
	return session.duration_minutes >= minimum;
}

/** Heart rate, when logged, against the coach's range. Null when either side is missing. */
export function inHeartRateZone(session: CardioRow, targets: ClientTargets | null) {
	if (session.avg_heart_rate === null || !targets) return null;
	if (targets.cardio_hr_min === null || targets.cardio_hr_max === null) return null;
	return (
		session.avg_heart_rate >= targets.cardio_hr_min &&
		session.avg_heart_rate <= targets.cardio_hr_max
	);
}

// ---------------------------------------------------------------------------------------------
// This week

export type WeekStatus = {
	start: string;
	/** Days from Monday to today, 1 to 7. */
	daysElapsed: number;
	steps: {
		target: number | null;
		todaySteps: number | null;
		daysLogged: number;
		daysOnTarget: number;
		average: number | null;
	};
	cardio: {
		sessions: number;
		/** Sessions that were long enough to count toward the requirement. */
		counted: number;
		minutes: number;
		inZone: number;
		requiredSessions: number | null;
	};
	workouts: number;
};

export function weekStatus(
	rows: DashboardRows,
	targets: ClientTargets | null,
	today: string
): WeekStatus {
	const start = weekStart(today);
	const inWeek = (date: string) => date >= start && date <= today;
	const target = targets?.daily_steps_target ?? null;

	const byDay = dailySteps(rows.steps);
	const thisWeekSteps = [...byDay].filter(([date]) => inWeek(date));
	const sessions = rows.cardio.filter((session) => inWeek(session.logged_on));

	return {
		start,
		daysElapsed: daysBetween(start, today) + 1,
		steps: {
			target,
			todaySteps: byDay.get(today) ?? null,
			daysLogged: thisWeekSteps.length,
			daysOnTarget:
				target === null ? 0 : thisWeekSteps.filter(([, steps]) => steps >= target).length,
			average:
				thisWeekSteps.length === 0
					? null
					: Math.round(
							thisWeekSteps.reduce((sum, [, steps]) => sum + steps, 0) / thisWeekSteps.length
						)
		},
		cardio: {
			sessions: sessions.length,
			counted: sessions.filter((session) => countsAsCardio(session, targets)).length,
			minutes: sessions.reduce((sum, session) => sum + session.duration_minutes, 0),
			inZone: sessions.filter((session) => inHeartRateZone(session, targets) === true).length,
			requiredSessions: targets?.cardio_sessions_per_week ?? null
		},
		workouts: rows.logs.filter((log) => log.completed && inWeek(log.logged_on)).length
	};
}

// ---------------------------------------------------------------------------------------------
// Weekly history (effort and consistency over time)

export type WeekPoint = {
	week: string;
	stepDaysOnTarget: number;
	stepDaysLogged: number;
	cardioSessions: number;
	cardioCounted: number;
	cardioMinutes: number;
	workouts: number;
};

/** The last `weeks` weeks, oldest first. */
export function weeklyHistory(
	rows: DashboardRows,
	targets: ClientTargets | null,
	today: string,
	weeks = 8
): WeekPoint[] {
	const target = targets?.daily_steps_target ?? null;
	const byDay = dailySteps(rows.steps);
	return weeksBack(today, weeks).map((week) => {
		const end = shiftDays(week, 6);
		const inWeek = (date: string) => date >= week && date <= end;
		const days = [...byDay].filter(([date]) => inWeek(date));
		const sessions = rows.cardio.filter((session) => inWeek(session.logged_on));
		return {
			week,
			stepDaysLogged: days.length,
			stepDaysOnTarget: target === null ? 0 : days.filter(([, steps]) => steps >= target).length,
			cardioSessions: sessions.length,
			cardioCounted: sessions.filter((session) => countsAsCardio(session, targets)).length,
			cardioMinutes: sessions.reduce((sum, session) => sum + session.duration_minutes, 0),
			workouts: rows.logs.filter((log) => log.completed && inWeek(log.logged_on)).length
		};
	});
}

// ---------------------------------------------------------------------------------------------
// Measurements (weight, waist)

export type MetricPeriod = { key: string; average: number };

export type MetricTrend = {
	/** One value per day (the average when measured more than once), oldest first. */
	points: { date: string; value: number }[];
	weekly: MetricPeriod[];
	monthly: MetricPeriod[];
	/** Latest week with measurements, and how it moved from the week with measurements before it. */
	week: { key: string; average: number; change: number | null; current: boolean } | null;
	month: { key: string; average: number; change: number | null; current: boolean } | null;
	/** First against latest measurement in the window. */
	overall: { start: number; latest: number; change: number; days: number } | null;
};

function periods(rows: MetricRow[], keyFor: (date: string) => string): MetricPeriod[] {
	const grouped = new Map<string, number[]>();
	for (const row of rows) {
		const key = keyFor(row.measured_on);
		grouped.set(key, [...(grouped.get(key) ?? []), row.value]);
	}
	return [...grouped]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([key, values]) => ({
			key,
			average: oneDecimal(values.reduce((sum, value) => sum + value, 0) / values.length)
		}));
}

function latestChange(list: MetricPeriod[], currentKey: string) {
	const latest = list.at(-1);
	if (!latest) return null;
	const previous = list.at(-2);
	return {
		key: latest.key,
		average: latest.average,
		change: previous ? oneDecimal(latest.average - previous.average) : null,
		current: latest.key === currentKey
	};
}

export function metricTrend(rows: MetricRow[], key: MetricKey, today: string): MetricTrend {
	const entries = rows
		.filter((row) => row.metric === key && row.measured_on <= today)
		.map((row) => ({ ...row, value: Number(row.value) }));

	const perDay = new Map<string, number[]>();
	for (const entry of entries)
		perDay.set(entry.measured_on, [...(perDay.get(entry.measured_on) ?? []), entry.value]);
	const points = [...perDay]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([date, values]) => ({
			date,
			value: oneDecimal(values.reduce((sum, value) => sum + value, 0) / values.length)
		}));

	const weekly = periods(entries, weekStart);
	const monthly = periods(entries, monthKey);
	const first = points.at(0);
	const last = points.at(-1);
	return {
		points,
		weekly,
		monthly,
		week: latestChange(weekly, weekStart(today)),
		month: latestChange(monthly, monthKey(today)),
		overall:
			first && last && first.date !== last.date
				? {
						start: first.value,
						latest: last.value,
						change: oneDecimal(last.value - first.value),
						days: daysBetween(first.date, last.date)
					}
				: null
	};
}

// ---------------------------------------------------------------------------------------------
// Strength

export type StrengthSession = {
	date: string;
	load: number;
	reps: number | null;
	/** Estimated one-rep max for the session's best set, in kg. */
	strength: number;
};

export type StrengthExercise = {
	key: string;
	name: string;
	sessions: StrengthSession[];
	/** Latest against first logged strength, in kg and percent. Null with a single session. */
	change: { kg: number; percent: number } | null;
};

/** The first whole number in a reps entry ("8-10" gives 8). Null when there is none. */
export function parseReps(reps: string | null | undefined): number | null {
	const match = typeof reps === 'string' ? reps.match(/\d+/) : null;
	const number = match ? Number(match[0]) : NaN;
	return Number.isFinite(number) && number >= 1 ? number : null;
}

/**
 * Estimated one-rep max (Epley): the same load for more reps counts as stronger. Beyond 12 reps the
 * estimate is unreliable, so reps are capped there. One rep, or reps not given, is just the load.
 */
export function estimateStrength(load: number, reps: number | null) {
	if (reps === null || reps <= 1) return oneDecimal(load);
	return oneDecimal(load * (1 + Math.min(reps, 12) / 30));
}

/** Per-exercise strength over time from logged loads and reps. Exercises without a load are left out. */
export function strengthProgress(logs: WorkoutRow[]): StrengthExercise[] {
	const byExercise = new Map<
		string,
		{ name: string; latestDate: string; days: Map<string, StrengthSession> }
	>();

	for (const log of logs) {
		if (!log.completed) continue;
		for (const entry of log.entries) {
			const load = Number(entry.load_kg);
			if (entry.completed === false || !Number.isFinite(load) || load <= 0) continue;
			const key = entry.name.trim().toLowerCase();
			if (!key) continue;
			const reps = parseReps(entry.reps);
			const session: StrengthSession = {
				date: log.logged_on,
				load,
				reps,
				strength: estimateStrength(load, reps)
			};
			const record = byExercise.get(key) ?? {
				name: entry.name.trim(),
				latestDate: log.logged_on,
				days: new Map<string, StrengthSession>()
			};
			// The display name follows the most recent log, in case the coach renamed the exercise.
			if (log.logged_on >= record.latestDate) {
				record.name = entry.name.trim();
				record.latestDate = log.logged_on;
			}
			const sameDay = record.days.get(log.logged_on);
			if (!sameDay || session.strength > sameDay.strength) record.days.set(log.logged_on, session);
			byExercise.set(key, record);
		}
	}

	return [...byExercise]
		.map(([key, record]): StrengthExercise => {
			const sessions = [...record.days.values()].sort((a, b) => a.date.localeCompare(b.date));
			const first = sessions[0];
			const last = sessions.at(-1)!;
			return {
				key,
				name: record.name,
				sessions,
				change:
					sessions.length > 1 && first.strength > 0
						? {
								kg: oneDecimal(last.strength - first.strength),
								percent: oneDecimal(((last.strength - first.strength) / first.strength) * 100)
							}
						: null
			};
		})
		.sort((a, b) => b.sessions.length - a.sessions.length || a.name.localeCompare(b.name));
}

// ---------------------------------------------------------------------------------------------
// Consistency and the four-week review

export type Consistency = {
	/** Days in a row, up to today, on or above the step target. Today does not break it until it ends. */
	stepStreak: number;
	/** Weeks in a row, up to this one, that met the cardio session requirement. */
	cardioWeekStreak: number;
};

export function consistency(
	rows: DashboardRows,
	targets: ClientTargets | null,
	today: string
): Consistency {
	let stepStreak = 0;
	const target = targets?.daily_steps_target ?? null;
	if (target !== null) {
		const byDay = dailySteps(rows.steps);
		// A day still in progress is not a miss, so start from yesterday when today is short.
		let day = (byDay.get(today) ?? 0) >= target ? today : shiftDays(today, -1);
		while ((byDay.get(day) ?? 0) >= target && stepStreak < 365) {
			stepStreak++;
			day = shiftDays(day, -1);
		}
	}

	let cardioWeekStreak = 0;
	const required = targets?.cardio_sessions_per_week ?? null;
	if (required !== null) {
		const history = weeklyHistory(rows, targets, today, 26).reverse();
		// The current week is only counted once it has met the requirement.
		const [current, ...earlier] = history;
		if (current.cardioCounted >= required) cardioWeekStreak++;
		for (const week of earlier) {
			if (week.cardioCounted < required) break;
			cardioWeekStreak++;
		}
	}
	return { stepStreak, cardioWeekStreak };
}

export type FourWeekReview = {
	days: number;
	effort: { workouts: number; cardioSessions: number; averageSteps: number | null };
	consistency: {
		stepDaysOnTarget: number | null;
		stepDays: number;
		cardioCounted: number | null;
		cardioRequired: number | null;
	};
	results: {
		weightChange: number | null;
		weightWeeks: number;
		topStrength: { name: string; percent: number } | null;
	};
};

/** The last 28 days side by side: effort, consistency, and what moved. */
export function fourWeekReview(
	rows: DashboardRows,
	targets: ClientTargets | null,
	today: string
): FourWeekReview {
	const days = 28;
	const since = shiftDays(today, -(days - 1));
	const inWindow = (date: string) => date >= since && date <= today;
	const target = targets?.daily_steps_target ?? null;

	const stepsInWindow = [...dailySteps(rows.steps)].filter(([date]) => inWindow(date));
	const sessions = rows.cardio.filter((session) => inWindow(session.logged_on));
	const required = targets?.cardio_sessions_per_week ?? null;

	// Weight: compare the first and last weekly averages that fall in the window.
	const weight = metricTrend(rows.metrics, 'body_weight_kg', today).weekly.filter(
		(period) => period.key >= weekStart(since)
	);
	const firstWeight = weight.at(0);
	const lastWeight = weight.at(-1);
	const weightChange =
		firstWeight && lastWeight && firstWeight.key !== lastWeight.key
			? oneDecimal(lastWeight.average - firstWeight.average)
			: null;

	// Strength: the exercise with the biggest gain in the window, and only a real gain.
	const strong = strengthProgress(rows.logs.filter((log) => inWindow(log.logged_on))).filter(
		(exercise) => exercise.change && exercise.change.percent > 0
	);
	const top = strong.sort((a, b) => b.change!.percent - a.change!.percent)[0];

	return {
		days,
		effort: {
			workouts: rows.logs.filter((log) => log.completed && inWindow(log.logged_on)).length,
			cardioSessions: sessions.length,
			averageSteps:
				stepsInWindow.length === 0
					? null
					: Math.round(
							stepsInWindow.reduce((sum, [, steps]) => sum + steps, 0) / stepsInWindow.length
						)
		},
		consistency: {
			stepDaysOnTarget:
				target === null ? null : stepsInWindow.filter(([, steps]) => steps >= target).length,
			stepDays: days,
			cardioCounted:
				required === null
					? null
					: sessions.filter((session) => countsAsCardio(session, targets)).length,
			cardioRequired: required === null ? null : required * (days / 7)
		},
		results: {
			weightChange,
			weightWeeks: firstWeight && lastWeight ? daysBetween(firstWeight.key, lastWeight.key) / 7 : 0,
			topStrength: top ? { name: top.name, percent: top.change!.percent } : null
		}
	};
}

// Metrics Cash has not yet agreed. Keep this list as the single place to change them.
export const progressMetrics = [
	{ key: 'body_weight_kg', label: 'Body weight', unit: 'kg', min: 20, max: 300 },
	{ key: 'waist_cm', label: 'Waist', unit: 'cm', min: 30, max: 200 }
] as const;

export type MetricKey = (typeof progressMetrics)[number]['key'];

export type LogSummaryInput = { logged_on: string; completed: boolean };
export type MetricSummaryInput = { metric: string; value: number; measured_on: string };

export type PeriodSummary = {
	key: string;
	workouts: number;
	averages: Partial<Record<MetricKey, number>>;
};

const dayMs = 24 * 60 * 60 * 1000;

function utcDate(iso: string) {
	return new Date(`${iso}T00:00:00Z`);
}

function isoDate(date: Date) {
	return date.toISOString().slice(0, 10);
}

function shiftDays(iso: string, days: number) {
	return isoDate(new Date(utcDate(iso).getTime() + days * dayMs));
}

function shiftMonths(iso: string, months: number) {
	// Start from the 1st so a 31st does not roll into the following month.
	const date = utcDate(iso);
	date.setUTCDate(1);
	date.setUTCMonth(date.getUTCMonth() - months);
	return isoDate(date);
}

/** The Monday that starts the week containing this date (YYYY-MM-DD). */
export function weekStart(iso: string) {
	const daysSinceMonday = (utcDate(iso).getUTCDay() + 6) % 7;
	return shiftDays(iso, -daysSinceMonday);
}

export function monthKey(iso: string) {
	return iso.slice(0, 7);
}

/** Rounded to one decimal place so the display does not jitter as values change. */
function averageOf(values: number[]) {
	if (values.length === 0) return undefined;
	const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
	return Math.round(mean * 10) / 10;
}

function summarise(
	logs: LogSummaryInput[],
	metrics: MetricSummaryInput[],
	keys: string[],
	keyFor: (iso: string) => string
): PeriodSummary[] {
	return keys.map((key) => {
		const workouts = logs.filter((log) => log.completed && keyFor(log.logged_on) === key).length;
		const averages: Partial<Record<MetricKey, number>> = {};
		for (const metric of progressMetrics) {
			const average = averageOf(
				metrics
					.filter((entry) => entry.metric === metric.key && keyFor(entry.measured_on) === key)
					.map((entry) => entry.value)
			);
			if (average !== undefined) averages[metric.key] = average;
		}
		return { key, workouts, averages };
	});
}

/** The last `weeks` weeks, newest first. Weeks run Monday to Sunday. */
export function weeklySummary(
	logs: LogSummaryInput[],
	metrics: MetricSummaryInput[],
	today: string,
	weeks = 12
): PeriodSummary[] {
	const keys = Array.from({ length: weeks }, (_, index) => weekStart(shiftDays(today, -7 * index)));
	return summarise(logs, metrics, keys, weekStart);
}

/** The last `months` calendar months, newest first. */
export function monthlySummary(
	logs: LogSummaryInput[],
	metrics: MetricSummaryInput[],
	today: string,
	months = 6
): PeriodSummary[] {
	const keys = Array.from({ length: months }, (_, index) => monthKey(shiftMonths(today, index)));
	return summarise(logs, metrics, keys, monthKey);
}

// The coach's targets for one client: daily steps, cardio and nutrition. Every value is optional.
// The limits match the check constraints in 20261115000000_client_targets_and_activity.sql.

export type ClientTargets = {
	daily_steps_target: number | null;
	cardio_minutes: number | null;
	cardio_sessions_per_week: number | null;
	cardio_hr_min: number | null;
	cardio_hr_max: number | null;
	cardio_notes: string | null;
	calories_kcal: number | null;
	protein_g: number | null;
	fat_g: number | null;
	carbs_g: number | null;
	nutrition_notes: string[];
};

export type ActivityTargets = Pick<
	ClientTargets,
	| 'daily_steps_target'
	| 'cardio_minutes'
	| 'cardio_sessions_per_week'
	| 'cardio_hr_min'
	| 'cardio_hr_max'
	| 'cardio_notes'
>;

export type NutritionTargets = Pick<
	ClientTargets,
	'calories_kcal' | 'protein_g' | 'fat_g' | 'carbs_g' | 'nutrition_notes'
>;

export const targetColumns =
	'daily_steps_target, cardio_minutes, cardio_sessions_per_week, cardio_hr_min, cardio_hr_max, cardio_notes, calories_kcal, protein_g, fat_g, carbs_g, nutrition_notes';

export const targetLimits = {
	steps: { min: 1000, max: 50000 },
	cardioMinutes: { min: 5, max: 300 },
	cardioSessions: { min: 1, max: 14 },
	heartRate: { min: 60, max: 220 },
	calories: { min: 800, max: 8000 },
	protein: { min: 0, max: 1000 },
	fat: { min: 0, max: 1000 },
	carbs: { min: 0, max: 1500 },
	cardioNotes: 1000,
	reminders: 20,
	reminderLength: 200
} as const;

export const noTargets: ClientTargets = {
	daily_steps_target: null,
	cardio_minutes: null,
	cardio_sessions_per_week: null,
	cardio_hr_min: null,
	cardio_hr_max: null,
	cardio_notes: null,
	calories_kcal: null,
	protein_g: null,
	fat_g: null,
	carbs_g: null,
	nutrition_notes: []
};

/** Fills gaps in a stored row, so pages can rely on every field being present. */
export function targetsFromRow(row: Partial<ClientTargets> | null | undefined): ClientTargets {
	const number = (value: unknown) =>
		value === null || value === undefined || value === '' || !Number.isFinite(Number(value))
			? null
			: Number(value);
	return {
		daily_steps_target: number(row?.daily_steps_target),
		cardio_minutes: number(row?.cardio_minutes),
		cardio_sessions_per_week: number(row?.cardio_sessions_per_week),
		cardio_hr_min: number(row?.cardio_hr_min),
		cardio_hr_max: number(row?.cardio_hr_max),
		cardio_notes:
			typeof row?.cardio_notes === 'string' && row.cardio_notes ? row.cardio_notes : null,
		calories_kcal: number(row?.calories_kcal),
		protein_g: number(row?.protein_g),
		fat_g: number(row?.fat_g),
		carbs_g: number(row?.carbs_g),
		nutrition_notes: Array.isArray(row?.nutrition_notes)
			? row.nutrition_notes.filter((note): note is string => typeof note === 'string')
			: []
	};
}

type Parsed<T> = { ok: true; value: T } | { ok: false; message: string };

/** A whole number in range, null when the field is blank, undefined when it is not valid. */
function wholeNumber(value: unknown, min: number, max: number): number | null | undefined {
	const text = typeof value === 'string' ? value.trim().replace(/,/g, '') : '';
	if (text === '') return null;
	if (!/^\d+$/.test(text)) return undefined;
	const number = Number(text);
	return number >= min && number <= max ? number : undefined;
}

const formatted = (number: number) => number.toLocaleString('en-GB');
const range = (min: number, max: number) => `between ${formatted(min)} and ${formatted(max)}`;

/** One reminder per line. Bullets and blank lines are dropped. Returns null if one is too long. */
export function remindersFromText(text: unknown): string[] | null {
	if (typeof text !== 'string') return [];
	const lines = text
		.split(/\r?\n/)
		.map((line) => line.replace(/^\s*(?:[-*•–]\s+)/, '').trim())
		.filter(Boolean);
	if (lines.some((line) => line.length > targetLimits.reminderLength)) return null;
	return lines;
}

/** Reads the coach's step and cardio form. Blank fields clear the target. */
export function parseActivityTargets(read: (name: string) => unknown): Parsed<ActivityTargets> {
	const steps = wholeNumber(
		read('daily_steps_target'),
		targetLimits.steps.min,
		targetLimits.steps.max
	);
	if (steps === undefined)
		return {
			ok: false,
			message: `Daily steps must be a whole number ${range(targetLimits.steps.min, targetLimits.steps.max)}.`
		};
	const minutes = wholeNumber(
		read('cardio_minutes'),
		targetLimits.cardioMinutes.min,
		targetLimits.cardioMinutes.max
	);
	if (minutes === undefined)
		return {
			ok: false,
			message: `Cardio minutes must be a whole number ${range(targetLimits.cardioMinutes.min, targetLimits.cardioMinutes.max)}.`
		};
	const sessions = wholeNumber(
		read('cardio_sessions_per_week'),
		targetLimits.cardioSessions.min,
		targetLimits.cardioSessions.max
	);
	if (sessions === undefined)
		return {
			ok: false,
			message: `Cardio sessions a week must be a whole number ${range(targetLimits.cardioSessions.min, targetLimits.cardioSessions.max)}.`
		};
	const hrMin = wholeNumber(
		read('cardio_hr_min'),
		targetLimits.heartRate.min,
		targetLimits.heartRate.max
	);
	const hrMax = wholeNumber(
		read('cardio_hr_max'),
		targetLimits.heartRate.min,
		targetLimits.heartRate.max
	);
	if (hrMin === undefined || hrMax === undefined)
		return {
			ok: false,
			message: `Heart rate must be a whole number ${range(targetLimits.heartRate.min, targetLimits.heartRate.max)} BPM.`
		};
	if ((hrMin === null) !== (hrMax === null))
		return { ok: false, message: 'Enter both ends of the heart-rate range, or leave both blank.' };
	if (hrMin !== null && hrMax !== null && hrMin > hrMax)
		return { ok: false, message: 'The lowest heart rate cannot be higher than the highest.' };

	const rawNotes = read('cardio_notes');
	const notes = typeof rawNotes === 'string' ? rawNotes.trim() : '';
	if (notes.length > targetLimits.cardioNotes)
		return {
			ok: false,
			message: `Cardio notes must be ${formatted(targetLimits.cardioNotes)} characters or fewer.`
		};

	return {
		ok: true,
		value: {
			daily_steps_target: steps,
			cardio_minutes: minutes,
			cardio_sessions_per_week: sessions,
			cardio_hr_min: hrMin,
			cardio_hr_max: hrMax,
			cardio_notes: notes || null
		}
	};
}

/** Reads the coach's calorie, macro and reminder form. Blank fields clear the target. */
export function parseNutritionTargets(read: (name: string) => unknown): Parsed<NutritionTargets> {
	const fields = [
		['calories_kcal', 'Calories', targetLimits.calories, 'kcal'],
		['protein_g', 'Protein', targetLimits.protein, 'g'],
		['fat_g', 'Fat', targetLimits.fat, 'g'],
		['carbs_g', 'Carbs', targetLimits.carbs, 'g']
	] as const;
	const values: Record<string, number | null> = {};
	for (const [name, label, limit, unit] of fields) {
		const value = wholeNumber(read(name), limit.min, limit.max);
		if (value === undefined)
			return {
				ok: false,
				message: `${label} must be a whole number ${range(limit.min, limit.max)} ${unit}.`
			};
		values[name] = value;
	}

	const reminders = remindersFromText(read('nutrition_notes'));
	if (reminders === null)
		return {
			ok: false,
			message: `Keep each reminder to ${targetLimits.reminderLength} characters or fewer.`
		};
	if (reminders.length > targetLimits.reminders)
		return { ok: false, message: `Add up to ${targetLimits.reminders} reminders.` };

	return {
		ok: true,
		value: {
			calories_kcal: values.calories_kcal,
			protein_g: values.protein_g,
			fat_g: values.fat_g,
			carbs_g: values.carbs_g,
			nutrition_notes: reminders
		}
	};
}

/** Calories in the macros: 4 per gram of protein or carbs, 9 per gram of fat. Null when none are set. */
export function macroCalories(
	targets: Pick<ClientTargets, 'protein_g' | 'fat_g' | 'carbs_g'>
): number | null {
	const { protein_g, fat_g, carbs_g } = targets;
	if (protein_g === null && fat_g === null && carbs_g === null) return null;
	return (protein_g ?? 0) * 4 + (fat_g ?? 0) * 9 + (carbs_g ?? 0) * 4;
}

export const hasStepTarget = (targets: ClientTargets | null) => targets?.daily_steps_target != null;

export const hasCardioTarget = (targets: ClientTargets | null) =>
	Boolean(
		targets &&
		(targets.cardio_minutes !== null ||
			targets.cardio_sessions_per_week !== null ||
			targets.cardio_hr_min !== null ||
			targets.cardio_notes)
	);

export const hasNutritionTarget = (targets: ClientTargets | null) =>
	Boolean(
		targets &&
		(targets.calories_kcal !== null ||
			targets.protein_g !== null ||
			targets.fat_g !== null ||
			targets.carbs_g !== null ||
			targets.nutrition_notes.length > 0)
	);

/** "30 min, 4× a week, 140–150 BPM": the cardio requirement in one line. Empty when none is set. */
export function cardioRequirement(targets: ClientTargets | null): string {
	if (!targets) return '';
	return [
		targets.cardio_minutes !== null ? `${targets.cardio_minutes} min` : '',
		targets.cardio_sessions_per_week !== null ? `${targets.cardio_sessions_per_week}× a week` : '',
		targets.cardio_hr_min !== null && targets.cardio_hr_max !== null
			? `${targets.cardio_hr_min}–${targets.cardio_hr_max} BPM`
			: ''
	]
		.filter(Boolean)
		.join(', ');
}

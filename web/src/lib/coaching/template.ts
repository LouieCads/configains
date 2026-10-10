import {
	dayRange,
	experienceLevels,
	goals,
	sexVariants,
	trainingLocations,
	type Experience,
	type SexVariant,
	type TrainingLocation
} from './options';

export { goals };

export const templateKinds = [
	{ value: 'workout', label: 'Workout' },
	{ value: 'nutrition', label: 'Nutrition' }
] as const;

export type TemplateKind = (typeof templateKinds)[number]['value'];

export type ExerciseInput = {
	id?: string;
	name: string;
	sets: number | null;
	reps: string | null;
	rest_seconds: number | null;
	notes: string | null;
};

export type PhaseInput = {
	id?: string;
	name: string;
	instructions: string | null;
	exercises: ExerciseInput[];
};

/** Who a workout template suits. Omitted keys mean any. Only workout templates use rules. */
export type TemplateRules = {
	experience?: Experience;
	training_location?: TrainingLocation;
	sex?: SexVariant;
	days_min?: number;
	days_max?: number;
};

export type TemplateInput = {
	id?: string;
	kind: TemplateKind;
	goal: string;
	name: string;
	description: string | null;
	is_archived: boolean;
	rules: TemplateRules;
	phases: PhaseInput[];
};

export type ValidationResult = { ok: true; value: TemplateInput } | { ok: false; message: string };

function choice<T extends string>(
	value: unknown,
	options: readonly { value: T }[],
	label: string
): T | undefined {
	if (value === '' || value === null || value === undefined) return undefined;
	if (!options.some((option) => option.value === value)) fail(`${label} is not a valid choice.`);
	return value as T;
}

function rulesFrom(raw: unknown, kind: unknown): TemplateRules {
	if (kind !== 'workout') return {};
	if (raw !== undefined && raw !== null && (typeof raw !== 'object' || Array.isArray(raw)))
		fail('Template rules could not be read.');
	const input = (raw ?? {}) as Record<string, unknown>;
	const rules: TemplateRules = {};
	const experience = choice(input.experience, experienceLevels, 'Experience');
	const location = choice(input.training_location, trainingLocations, 'Training location');
	const sex = choice(input.sex, sexVariants, 'Program variant');
	const min = whole(input.days_min, 'Minimum days', dayRange) ?? undefined;
	const max = whole(input.days_max, 'Maximum days', dayRange) ?? undefined;
	if (min !== undefined && max !== undefined && min > max)
		fail('Minimum days cannot be more than maximum days.');
	if (experience) rules.experience = experience;
	if (location) rules.training_location = location;
	if (sex) rules.sex = sex;
	if (min !== undefined) rules.days_min = min;
	if (max !== undefined) rules.days_max = max;
	return rules;
}

const limits = {
	name: 120,
	description: 1000,
	instructions: 2000,
	reps: 40,
	notes: 500,
	phases: 30,
	exercises: 40,
	sets: [1, 20],
	rest: [0, 900]
} as const;

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class InvalidTemplate extends Error {}

function fail(message: string): never {
	throw new InvalidTemplate(message);
}

function text(value: unknown, label: string, max: number, required = false): string | null {
	const trimmed = typeof value === 'string' ? value.trim() : '';
	if (!trimmed) {
		if (required) fail(`${label} is required.`);
		return null;
	}
	if (trimmed.length > max) fail(`${label} must be ${max} characters or fewer.`);
	return trimmed;
}

function whole(
	value: unknown,
	label: string,
	[min, max]: readonly [number, number]
): number | null {
	if (value === '' || value === null || value === undefined) return null;
	const number = typeof value === 'number' ? value : Number(value);
	if (!Number.isInteger(number) || number < min || number > max)
		fail(`${label} must be a whole number from ${min} to ${max}.`);
	return number;
}

function recordId(value: unknown, label: string): string | undefined {
	if (value === '' || value === null || value === undefined) return undefined;
	if (typeof value !== 'string' || !uuidPattern.test(value)) fail(`${label} is not valid.`);
	return value;
}

function list(value: unknown, label: string, max: number): unknown[] {
	if (value === undefined || value === null) return [];
	if (!Array.isArray(value)) fail(`${label} could not be read.`);
	if (value.length > max) fail(`${label} can have at most ${max} items.`);
	return value;
}

/**
 * Checks a template from the editor (or a form post) before it reaches the database.
 * The database check constraints still apply; this gives clear messages first.
 */
export function validateTemplate(raw: unknown): ValidationResult {
	try {
		if (!raw || typeof raw !== 'object') fail('The template could not be read.');
		const input = raw as Record<string, unknown>;

		if (!templateKinds.some((kind) => kind.value === input.kind))
			fail('Choose a workout or nutrition template.');
		if (typeof input.goal !== 'string' || !goals.some((goal) => goal.value === input.goal))
			fail('Choose a goal.');

		const phases = list(input.phases, 'Phases', limits.phases).map((rawPhase, phaseIndex) => {
			const phase = (rawPhase ?? {}) as Record<string, unknown>;
			const label = `Phase ${phaseIndex + 1}`;
			const exercises = list(phase.exercises, `${label} exercises`, limits.exercises).map(
				(rawExercise, exerciseIndex) => {
					const exercise = (rawExercise ?? {}) as Record<string, unknown>;
					const exerciseLabel = `${label}, exercise ${exerciseIndex + 1}`;
					return {
						id: recordId(exercise.id, exerciseLabel),
						name: text(exercise.name, `${exerciseLabel} name`, limits.name, true) as string,
						sets: whole(exercise.sets, `${exerciseLabel} sets`, limits.sets),
						reps: text(exercise.reps, `${exerciseLabel} reps`, limits.reps),
						rest_seconds: whole(exercise.rest_seconds, `${exerciseLabel} rest`, limits.rest),
						notes: text(exercise.notes, `${exerciseLabel} notes`, limits.notes)
					};
				}
			);
			return {
				id: recordId(phase.id, label),
				name: text(phase.name, `${label} name`, limits.name, true) as string,
				instructions: text(phase.instructions, `${label} instructions`, limits.instructions),
				exercises
			};
		});
		if (phases.length === 0) fail('Add at least one phase.');

		return {
			ok: true,
			value: {
				id: recordId(input.id, 'Template'),
				kind: input.kind as TemplateKind,
				goal: input.goal as string,
				name: text(input.name, 'Name', limits.name, true) as string,
				description: text(input.description, 'Description', limits.description),
				is_archived: input.is_archived === true,
				rules: rulesFrom(input.rules, input.kind),
				phases
			}
		};
	} catch (error) {
		if (error instanceof InvalidTemplate) return { ok: false, message: error.message };
		throw error;
	}
}

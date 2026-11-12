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

/** One set's target when sets differ, for example 6-10 reps on set 1 and 8-12 after. */
export type SetTarget = { reps: string | null; rir: string | null };

export type ExerciseInput = {
	id?: string;
	name: string;
	/** With a set plan, always the plan's length. */
	sets: number | null;
	/** Reps for every set. With a set plan, a short summary of the plan. */
	reps: string | null;
	/** Reps in reserve for every set, for example "2" or "1-2". */
	rir: string | null;
	/** Empty when every set is the same. Otherwise one target per set. */
	set_plan: SetTarget[];
	rest_seconds: number | null;
	notes: string | null;
};

export type PhaseInput = {
	id?: string;
	name: string;
	instructions: string | null;
	/** Planned length, so the coach is reminded when the client is due to move on. */
	duration_weeks: number | null;
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

/** Shown beside every RIR field and target. */
export const rirHelp =
	'RIR means reps in reserve: how many more good reps you could still do when you stop the set. RIR 2 means finish with about 2 reps left in the tank. RIR 0 means you could not do another.';

const sameTarget = (a: SetTarget, b: SetTarget) => a.reps === b.reps && a.rir === b.rir;

/** Short reps text for a varied plan, for example "6-10, 8-12 x2". Fits the 40-character reps field. */
export function repsSummary(plan: SetTarget[]): string | null {
	const groups: { reps: string; count: number }[] = [];
	for (const set of plan) {
		const reps = set.reps ?? '-';
		const last = groups.at(-1);
		if (last && last.reps === reps) last.count++;
		else groups.push({ reps, count: 1 });
	}
	if (groups.every((group) => group.reps === '-')) return null;
	const summary = groups
		.map((group) => (group.count > 1 ? `${group.reps} x${group.count}` : group.reps))
		.join(', ');
	return summary.length <= limits.reps ? summary : `${summary.slice(0, limits.reps - 1)}…`;
}

/** Every set's target: the set plan, or the exercise's reps and RIR repeated for each set. */
export function setTargets(
	exercise: Pick<ExerciseInput, 'sets' | 'reps' | 'rir' | 'set_plan'>
): SetTarget[] {
	if (exercise.set_plan?.length) return exercise.set_plan;
	return Array.from({ length: exercise.sets ?? 0 }, () => ({
		reps: exercise.reps,
		rir: exercise.rir ?? null
	}));
}

/** One line for an exercise, for example "3 sets, 8-10 reps, RIR 2, 90s rest". */
export function prescription(
	exercise: Pick<ExerciseInput, 'sets' | 'reps' | 'rir' | 'set_plan' | 'rest_seconds'>
): string {
	const varied = (exercise.set_plan?.length ?? 0) > 0;
	return [
		exercise.sets && `${exercise.sets} sets`,
		!varied && exercise.reps && `${exercise.reps} reps`,
		!varied && exercise.rir && `RIR ${exercise.rir}`,
		exercise.rest_seconds != null && `${exercise.rest_seconds}s rest`
	]
		.filter(Boolean)
		.join(', ');
}

/**
 * The same program as a new library template: no row ids (so every phase and exercise saves as a
 * new row) and not archived. save_program_template never sets a client owner, so it is a library row.
 */
export function asLibraryTemplate(template: TemplateInput, name: string): TemplateInput {
	return {
		...template,
		id: undefined,
		name,
		is_archived: false,
		phases: template.phases.map((phase) => ({
			...phase,
			id: undefined,
			exercises: phase.exercises.map((exercise) => ({ ...exercise, id: undefined }))
		}))
	};
}

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
	rir: 10,
	notes: 500,
	weeks: [1, 52],
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
					const plan = list(exercise.set_plan, `${exerciseLabel} sets`, limits.sets[1]).map(
						(rawSet, setIndex) => {
							const set = (rawSet ?? {}) as Record<string, unknown>;
							const setLabel = `${exerciseLabel}, set ${setIndex + 1}`;
							return {
								reps: text(set.reps, `${setLabel} reps`, limits.reps),
								rir: text(set.rir, `${setLabel} RIR`, limits.rir)
							};
						}
					);
					// A plan with one set, or with every set the same, is stored as plain sets.
					const uniform = plan.length > 0 && plan.every((set) => sameTarget(set, plan[0]));
					const varied = plan.length > 1 && !uniform;
					return {
						id: recordId(exercise.id, exerciseLabel),
						name: text(exercise.name, `${exerciseLabel} name`, limits.name, true) as string,
						sets: varied
							? plan.length
							: uniform
								? plan.length
								: whole(exercise.sets, `${exerciseLabel} sets`, limits.sets),
						reps: varied
							? repsSummary(plan)
							: uniform
								? plan[0].reps
								: text(exercise.reps, `${exerciseLabel} reps`, limits.reps),
						rir: varied
							? null
							: uniform
								? plan[0].rir
								: text(exercise.rir, `${exerciseLabel} RIR`, limits.rir),
						set_plan: varied ? plan : [],
						rest_seconds: whole(exercise.rest_seconds, `${exerciseLabel} rest`, limits.rest),
						notes: text(exercise.notes, `${exerciseLabel} notes`, limits.notes)
					};
				}
			);
			return {
				id: recordId(phase.id, label),
				name: text(phase.name, `${label} name`, limits.name, true) as string,
				instructions: text(phase.instructions, `${label} instructions`, limits.instructions),
				duration_weeks: whole(phase.duration_weeks, `${label} length in weeks`, limits.weeks),
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

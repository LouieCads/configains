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

// Placeholder wording until Cash approves the final assessment questions.
export const healthFlags = [
	{ value: 'injury', label: 'A current or recent injury' },
	{ value: 'medical_condition', label: 'A medical condition' },
	{ value: 'pregnancy', label: 'Pregnancy or recent childbirth' },
	{ value: 'recent_surgery', label: 'Surgery in the last 6 months' }
] as const;

export const clientSexOptions = [
	...sexVariants,
	{ value: 'prefer_not_to_say', label: 'Prefer not to say' }
] as const;

export type Answers = {
	goal: string;
	experience: Experience;
	training_location: TrainingLocation;
	days_per_week: number;
	sex: SexVariant | 'prefer_not_to_say';
	health: string[];
};

export type AssessmentResult =
	{ ok: true; value: Answers; redFlags: string[] } | { ok: false; message: string };

const healthValues = [...healthFlags.map((flag) => flag.value), 'none'] as string[];

/** Checks answers from the assessment form. Any health flag means a personal review, not an AI plan. */
export function validateAssessment(raw: {
	goal?: unknown;
	experience?: unknown;
	training_location?: unknown;
	days_per_week?: unknown;
	sex?: unknown;
	health?: unknown;
}): AssessmentResult {
	const goal = typeof raw.goal === 'string' && goals.some((option) => option.value === raw.goal);
	const experience = experienceLevels.some((option) => option.value === raw.experience);
	const location = trainingLocations.some((option) => option.value === raw.training_location);
	const days = Number(raw.days_per_week);
	const daysValid = Number.isInteger(days) && days >= dayRange[0] && days <= dayRange[1];
	const sex = clientSexOptions.some((option) => option.value === raw.sex);
	const health = Array.isArray(raw.health) ? raw.health.map(String) : [];
	const healthValid = health.every((value) => healthValues.includes(value));
	const noneWithOthers = health.includes('none') && health.length > 1;

	if (!goal) return { ok: false, message: 'Choose your main goal.' };
	if (!experience) return { ok: false, message: 'Choose your training experience.' };
	if (!location) return { ok: false, message: 'Choose where you will train.' };
	if (!daysValid) return { ok: false, message: 'Choose how many days a week you can train.' };
	if (!sex) return { ok: false, message: 'Choose a program variant, or prefer not to say.' };
	if (!healthValid || noneWithOthers)
		return {
			ok: false,
			message: 'Check the health options that apply, or choose none on its own.'
		};

	const redFlags = [...new Set(health.filter((value) => value !== 'none'))];
	return {
		ok: true,
		redFlags,
		value: {
			goal: raw.goal as string,
			experience: raw.experience as Experience,
			training_location: raw.training_location as TrainingLocation,
			days_per_week: days,
			sex: raw.sex as Answers['sex'],
			health: redFlags
		}
	};
}

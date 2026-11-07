import { clientSexOptions, healthFlags } from './assessment';
import { goals, trainingLocations } from './options';

// Short forms for scanning lists. The assessment form keeps the longer wording.
const experienceShort: Record<string, string> = {
	beginner: 'Beginner',
	intermediate: 'Intermediate',
	advanced: 'Advanced'
};

const labelOf = (options: readonly { value: string; label: string }[], value: unknown) =>
	typeof value === 'string'
		? (options.find((option) => option.value === value)?.label ?? value)
		: '';

export const goalLabel = (value: unknown) => labelOf(goals, value);
export const healthLabel = (value: string) => labelOf(healthFlags, value);

/** Assessment answers as short label/value pairs. Missing answers are left out. */
export function answerSummary(answers: Record<string, unknown> | null | undefined) {
	if (!answers) return [];
	const days = Number(answers.days_per_week);
	return [
		{ label: 'Goal', value: goalLabel(answers.goal) },
		{
			label: 'Experience',
			value:
				typeof answers.experience === 'string' ? (experienceShort[answers.experience] ?? '') : ''
		},
		{ label: 'Trains at', value: labelOf(trainingLocations, answers.training_location) },
		{ label: 'Days a week', value: Number.isFinite(days) && days > 0 ? String(days) : '' },
		{ label: 'Variant', value: labelOf(clientSexOptions, answers.sex) }
	].filter((item) => item.value);
}

export const assessmentStatus: Record<string, { label: string; tone: 'ok' | 'warn' | 'neutral' }> =
	{
		submitted: { label: 'Waiting for matching', tone: 'neutral' },
		ai_matched: { label: 'AI plan assigned', tone: 'ok' },
		needs_human_review: { label: 'Needs your review', tone: 'warn' },
		human_assigned: { label: 'Reviewed', tone: 'neutral' }
	};

/** Statuses still waiting on the coach. */
export const openStatuses = ['submitted', 'needs_human_review'];

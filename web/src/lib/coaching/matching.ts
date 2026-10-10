import type { TemplateRules } from './template';
import type { Answers } from './assessment';

export type MatchableTemplate = {
	id: string;
	kind: string;
	goal: string;
	name: string;
	description?: string | null;
	rules: TemplateRules | null;
};

type Profile = Pick<Answers, 'goal' | 'experience' | 'training_location' | 'days_per_week' | 'sex'>;

// A rule that is absent means "any". A rule that is set must match the client exactly.
function fits<T>(rule: T | undefined, value: T) {
	return rule === undefined || rule === value;
}

export function workoutFits(profile: Profile, template: MatchableTemplate) {
	const rules = template.rules ?? {};
	return (
		template.goal === profile.goal &&
		fits(rules.experience, profile.experience) &&
		fits(rules.training_location, profile.training_location) &&
		fits(rules.sex, profile.sex as TemplateRules['sex']) &&
		(rules.days_min === undefined || profile.days_per_week >= rules.days_min) &&
		(rules.days_max === undefined || profile.days_per_week <= rules.days_max)
	);
}

export function nutritionFits(profile: Profile, template: MatchableTemplate) {
	return template.goal === profile.goal;
}

// More specific templates rank first, so a template written for this exact profile beats a general one.
function specificity(template: MatchableTemplate) {
	return Object.keys(template.rules ?? {}).length;
}

function rank(a: MatchableTemplate, b: MatchableTemplate) {
	return specificity(b) - specificity(a) || a.name.localeCompare(b.name);
}

/** Filters approved templates to those that fit the client. Only these may be chosen or explained. */
export function eligiblePrograms(profile: Profile, templates: MatchableTemplate[]) {
	return {
		workouts: templates
			.filter((template) => template.kind === 'workout' && workoutFits(profile, template))
			.sort(rank),
		nutrition: templates
			.filter((template) => template.kind === 'nutrition' && nutritionFits(profile, template))
			.sort(rank)
	};
}

import { describe, expect, it } from 'vitest';
import { eligiblePrograms, type MatchableTemplate } from './matching';

const profile = {
	goal: 'fat_loss',
	experience: 'beginner' as const,
	training_location: 'home' as const,
	days_per_week: 3,
	sex: 'female' as const
};

const template = (overrides: Partial<MatchableTemplate>): MatchableTemplate => ({
	id: crypto.randomUUID(),
	kind: 'workout',
	goal: 'fat_loss',
	name: 'Generic',
	rules: {},
	...overrides
});

describe('eligiblePrograms', () => {
	it('keeps templates whose rules fit and drops the rest', () => {
		const home = template({ name: 'Home', rules: { training_location: 'home' } });
		const gym = template({ name: 'Gym', rules: { training_location: 'gym' } });
		const wrongGoal = template({ name: 'Muscle', goal: 'muscle_gain' });
		const result = eligiblePrograms(profile, [home, gym, wrongGoal]);
		expect(result.workouts.map((t) => t.name)).toEqual(['Home']);
	});

	it('respects the days-per-week range', () => {
		const fourToFive = template({ name: 'Four to five', rules: { days_min: 4, days_max: 5 } });
		expect(eligiblePrograms(profile, [fourToFive]).workouts).toEqual([]);
		expect(eligiblePrograms({ ...profile, days_per_week: 4 }, [fourToFive]).workouts).toHaveLength(
			1
		);
	});

	it('only offers a sex-specific template to a client who chose that variant', () => {
		const femaleOnly = template({ name: 'Female', rules: { sex: 'female' } });
		expect(eligiblePrograms({ ...profile, sex: 'male' }, [femaleOnly]).workouts).toEqual([]);
		expect(
			eligiblePrograms({ ...profile, sex: 'prefer_not_to_say' }, [femaleOnly]).workouts
		).toEqual([]);
	});

	it('ranks more specific templates ahead of general ones', () => {
		const general = template({ name: 'A general' });
		const specific = template({
			name: 'Z specific',
			rules: { experience: 'beginner', training_location: 'home' }
		});
		expect(eligiblePrograms(profile, [general, specific]).workouts.map((t) => t.name)).toEqual([
			'Z specific',
			'A general'
		]);
	});

	it('matches nutrition by goal only', () => {
		const meals = template({ kind: 'nutrition', name: 'Meals', rules: null });
		expect(eligiblePrograms(profile, [meals]).nutrition).toHaveLength(1);
		expect(eligiblePrograms({ ...profile, goal: 'maintenance' }, [meals]).nutrition).toEqual([]);
	});
});

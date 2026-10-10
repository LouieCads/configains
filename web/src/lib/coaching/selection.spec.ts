import { describe, expect, it } from 'vitest';
import { chooseProgram, parseSelection, type SelectionRequest } from './selection';

const request: SelectionRequest = {
	goal: 'fat_loss',
	experience: 'beginner',
	training_location: 'home',
	days_per_week: 3,
	workouts: [
		{ id: 'w1', name: 'Home foundations', description: null },
		{ id: 'w2', name: 'Home builder', description: null }
	],
	nutrition: [{ id: 'n1', name: 'Fat loss guidance', description: null }]
};

describe('parseSelection', () => {
	it('accepts a choice from the candidate list', () => {
		expect(
			parseSelection({ workout_id: 'w2', nutrition_id: 'n1', explanation: 'Good fit.' }, request)
		).toEqual({ workoutId: 'w2', nutritionId: 'n1', explanation: 'Good fit.' });
	});

	it('rejects an id the model invented', () => {
		expect(
			parseSelection({ workout_id: 'made-up', nutrition_id: 'n1', explanation: 'x' }, request)
		).toBeNull();
	});

	it('requires a nutrition pick when nutrition candidates exist', () => {
		expect(
			parseSelection({ workout_id: 'w1', nutrition_id: null, explanation: 'x' }, request)
		).toBeNull();
	});

	it('rejects an empty or overlong explanation', () => {
		expect(
			parseSelection({ workout_id: 'w1', nutrition_id: 'n1', explanation: '  ' }, request)
		).toBeNull();
		expect(
			parseSelection(
				{ workout_id: 'w1', nutrition_id: 'n1', explanation: 'x'.repeat(501) },
				request
			)
		).toBeNull();
	});
});

describe('chooseProgram', () => {
	it('uses the model when its answer is valid', async () => {
		const selection = await chooseProgram(request, async () => ({
			workout_id: 'w2',
			nutrition_id: 'n1',
			explanation: 'Builds on your schedule.'
		}));
		expect(selection).toMatchObject({ workoutId: 'w2', source: 'ai' });
	});

	it('falls back to the first rule match when the model returns an unapproved choice', async () => {
		const selection = await chooseProgram(request, async () => ({
			workout_id: 'other',
			explanation: 'x'
		}));
		expect(selection).toMatchObject({ workoutId: 'w1', nutritionId: 'n1', source: 'rules' });
	});

	it('falls back when the model call fails', async () => {
		const selection = await chooseProgram(request, async () => {
			throw new Error('timeout');
		});
		expect(selection).toMatchObject({ workoutId: 'w1', source: 'rules' });
	});

	it('uses rules alone when no model is configured', async () => {
		expect(await chooseProgram(request, null)).toMatchObject({ workoutId: 'w1', source: 'rules' });
	});

	it('refuses to choose when there are no eligible workouts', async () => {
		await expect(chooseProgram({ ...request, workouts: [] }, null)).rejects.toThrow(
			'No eligible workout templates.'
		);
	});
});

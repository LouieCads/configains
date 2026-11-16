import { describe, expect, it } from 'vitest';
import {
	cardioRequirement,
	hasCardioTarget,
	hasNutritionTarget,
	hasStepTarget,
	macroCalories,
	noTargets,
	parseActivityTargets,
	parseNutritionTargets,
	remindersFromText,
	targetsFromRow
} from './targets';

const reader = (values: Record<string, string>) => (name: string) => values[name] ?? '';

describe('activity targets form', () => {
	it('reads the coach example: 8,000 steps, 30 min cardio 4x a week at 140–150 BPM', () => {
		const result = parseActivityTargets(
			reader({
				daily_steps_target: '8,000',
				cardio_minutes: '30',
				cardio_sessions_per_week: '4',
				cardio_hr_min: '140',
				cardio_hr_max: '150',
				cardio_notes: '  Any cardio mode is acceptable. Avoid HIIT.  '
			})
		);
		expect(result).toEqual({
			ok: true,
			value: {
				daily_steps_target: 8000,
				cardio_minutes: 30,
				cardio_sessions_per_week: 4,
				cardio_hr_min: 140,
				cardio_hr_max: 150,
				cardio_notes: 'Any cardio mode is acceptable. Avoid HIIT.'
			}
		});
	});

	it('clears a target when its field is blank', () => {
		const result = parseActivityTargets(reader({}));
		expect(result).toEqual({
			ok: true,
			value: {
				daily_steps_target: null,
				cardio_minutes: null,
				cardio_sessions_per_week: null,
				cardio_hr_min: null,
				cardio_hr_max: null,
				cardio_notes: null
			}
		});
	});

	it.each([
		['daily_steps_target', '500'],
		['daily_steps_target', '60000'],
		['daily_steps_target', '8000.5'],
		['daily_steps_target', 'lots'],
		['cardio_minutes', '2'],
		['cardio_sessions_per_week', '15'],
		['cardio_hr_min', '20'],
		['cardio_hr_max', '300']
	])('rejects %s = %s', (name, value) => {
		const result = parseActivityTargets(reader({ [name]: value }));
		expect(result.ok).toBe(false);
	});

	it('needs both ends of the heart-rate range', () => {
		const result = parseActivityTargets(reader({ cardio_hr_min: '140' }));
		expect(result).toMatchObject({ ok: false, message: expect.stringContaining('both ends') });
	});

	it('rejects a range with the lowest above the highest', () => {
		const result = parseActivityTargets(reader({ cardio_hr_min: '150', cardio_hr_max: '140' }));
		expect(result.ok).toBe(false);
	});

	it('rejects overlong cardio notes', () => {
		expect(parseActivityTargets(reader({ cardio_notes: 'x'.repeat(1001) })).ok).toBe(false);
		expect(parseActivityTargets(reader({ cardio_notes: 'x'.repeat(1000) })).ok).toBe(true);
	});
});

describe('nutrition targets form', () => {
	it('reads the coach example: 2,030 kcal, 130 g protein, 30 g fat, 310 g carbs', () => {
		const result = parseNutritionTargets(
			reader({
				calories_kcal: '2030',
				protein_g: '130',
				fat_g: '30',
				carbs_g: '310',
				nutrition_notes:
					'No binging on weekends.\n- Avoid fatty foods.\n\n  Don’t give in to stress eating.  '
			})
		);
		expect(result).toEqual({
			ok: true,
			value: {
				calories_kcal: 2030,
				protein_g: 130,
				fat_g: 30,
				carbs_g: 310,
				nutrition_notes: [
					'No binging on weekends.',
					'Avoid fatty foods.',
					'Don’t give in to stress eating.'
				]
			}
		});
	});

	it('accepts zero for a macro', () => {
		const result = parseNutritionTargets(reader({ fat_g: '0' }));
		expect(result).toMatchObject({ ok: true, value: { fat_g: 0 } });
	});

	it.each([
		['calories_kcal', '300'],
		['calories_kcal', '9000'],
		['protein_g', '-5'],
		['protein_g', '1001'],
		['carbs_g', '1501'],
		['fat_g', 'a lot']
	])('rejects %s = %s', (name, value) => {
		expect(parseNutritionTargets(reader({ [name]: value })).ok).toBe(false);
	});

	it('rejects too many or too long reminders', () => {
		const many = Array.from({ length: 21 }, (_, index) => `Reminder ${index}`).join('\n');
		expect(parseNutritionTargets(reader({ nutrition_notes: many })).ok).toBe(false);
		expect(parseNutritionTargets(reader({ nutrition_notes: 'x'.repeat(201) })).ok).toBe(false);
	});
});

describe('reminders', () => {
	it('splits on lines, strips bullets and blanks', () => {
		expect(remindersFromText('a\r\n* b\n  • c  \n\n')).toEqual(['a', 'b', 'c']);
	});

	it('keeps a hyphen that is part of the text', () => {
		expect(remindersFromText('Well-balanced meals')).toEqual(['Well-balanced meals']);
	});

	it('returns null when a line is too long', () => {
		expect(remindersFromText('x'.repeat(201))).toBeNull();
	});
});

describe('macros', () => {
	it('adds up to the example calories: 4 per g protein and carbs, 9 per g fat', () => {
		expect(macroCalories({ protein_g: 130, fat_g: 30, carbs_g: 310 })).toBe(2030);
	});

	it('is null when no macro is set and treats a missing one as zero otherwise', () => {
		expect(macroCalories({ protein_g: null, fat_g: null, carbs_g: null })).toBeNull();
		expect(macroCalories({ protein_g: 100, fat_g: null, carbs_g: null })).toBe(400);
	});
});

describe('stored targets', () => {
	it('fills gaps and converts numeric strings', () => {
		const targets = targetsFromRow({ daily_steps_target: '8000' as unknown as number });
		expect(targets.daily_steps_target).toBe(8000);
		expect(targets.cardio_minutes).toBeNull();
		expect(targets.nutrition_notes).toEqual([]);
	});

	it('treats a missing row as no targets', () => {
		expect(targetsFromRow(null)).toEqual(noTargets);
	});

	it('describes which targets are set', () => {
		expect(hasStepTarget(noTargets)).toBe(false);
		expect(hasStepTarget({ ...noTargets, daily_steps_target: 8000 })).toBe(true);
		expect(hasCardioTarget({ ...noTargets, cardio_notes: 'Avoid HIIT.' })).toBe(true);
		expect(hasCardioTarget(noTargets)).toBe(false);
		expect(hasNutritionTarget({ ...noTargets, nutrition_notes: ['Eat slowly.'] })).toBe(true);
		expect(hasNutritionTarget(null)).toBe(false);
	});

	it('writes the cardio requirement on one line', () => {
		expect(
			cardioRequirement({
				...noTargets,
				cardio_minutes: 30,
				cardio_sessions_per_week: 4,
				cardio_hr_min: 140,
				cardio_hr_max: 150
			})
		).toBe('30 min, 4× a week, 140–150 BPM');
		expect(cardioRequirement({ ...noTargets, cardio_minutes: 20 })).toBe('20 min');
		expect(cardioRequirement(null)).toBe('');
	});
});

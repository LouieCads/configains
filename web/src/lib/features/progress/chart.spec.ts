import { describe, expect, it } from 'vitest';
import {
	columnPath,
	dateBetween,
	formatAxis,
	formatFixed,
	formatNumber,
	longDate,
	nearestIndex,
	niceTicks,
	shortDate,
	signed
} from './chart';

describe('niceTicks', () => {
	it('covers the range with clean steps', () => {
		expect(niceTicks(0, 9000, 4)).toEqual([0, 2000, 4000, 6000, 8000, 10000]);
		expect(niceTicks(78.6, 81, 4)).toEqual([78.5, 79, 79.5, 80, 80.5, 81]);
	});

	it('always includes the whole range', () => {
		for (const [min, max] of [
			[0, 7],
			[3.2, 3.9],
			[0, 120_000],
			[45, 46]
		]) {
			const ticks = niceTicks(min, max);
			expect(ticks[0]).toBeLessThanOrEqual(min);
			expect(ticks.at(-1)).toBeGreaterThanOrEqual(max);
		}
	});

	it('gives a flat series a visible range', () => {
		const ticks = niceTicks(80, 80);
		expect(ticks.length).toBeGreaterThan(1);
		expect(ticks[0]).toBeLessThan(80);
		expect(ticks.at(-1)).toBeGreaterThan(80);
	});

	it('handles a zero series', () => {
		const ticks = niceTicks(0, 0);
		expect(ticks.length).toBeGreaterThan(1);
	});

	it('avoids floating point noise', () => {
		expect(niceTicks(0, 0.7, 7)).toEqual([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]);
	});
});

describe('formatting', () => {
	it('writes axis values in full, or compact on a tall axis', () => {
		expect(formatAxis(8000, false)).toBe('8,000');
		expect(formatAxis(12_500, true)).toBe('12.5K');
		expect(formatAxis(10_000, true)).toBe('10K');
		expect(formatAxis(500, true)).toBe('500');
	});

	it('formats numbers with a limit on decimals', () => {
		expect(formatNumber(8123)).toBe('8,123');
		expect(formatNumber(78.64, 1)).toBe('78.6');
		expect(formatNumber(80, 1)).toBe('80');
	});

	it('keeps trailing decimals when asked', () => {
		expect(formatFixed(84)).toBe('84.0');
		expect(formatFixed(78.64)).toBe('78.6');
		expect(formatFixed(1234.5)).toBe('1,234.5');
	});

	it('signs changes with a real minus sign and shows no sign for zero', () => {
		expect(signed(1.24)).toBe('+1.2');
		expect(signed(-0.8)).toBe('−0.8');
		expect(signed(0)).toBe('0');
		expect(signed(-0.04)).toBe('0');
	});

	it('formats dates in UTC', () => {
		expect(shortDate('2026-11-12')).toBe('12 Nov');
		expect(longDate('2026-11-12')).toBe('Thu 12 Nov');
	});

	it('finds the date part way between two dates', () => {
		expect(dateBetween('2026-11-01', '2026-11-11', 0.5)).toBe('2026-11-06');
		expect(dateBetween('2026-11-01', '2026-11-11', 1)).toBe('2026-11-11');
	});
});

describe('nearestIndex', () => {
	it('returns the closest position', () => {
		expect(nearestIndex([10, 50, 90], 60)).toBe(1);
		expect(nearestIndex([10, 50, 90], -20)).toBe(0);
		expect(nearestIndex([10, 50, 90], 500)).toBe(2);
	});

	it('is -1 for nothing to choose from', () => {
		expect(nearestIndex([], 5)).toBe(-1);
	});
});

describe('columnPath', () => {
	it('draws nothing for an empty column', () => {
		expect(columnPath(0, 100, 20, 0)).toBe('');
	});

	it('rounds the top and keeps the base square', () => {
		const path = columnPath(10, 100, 20, 50);
		expect(path.startsWith('M10,100V54')).toBe(true);
		expect(path.endsWith('V100Z')).toBe(true);
	});

	it('shrinks the radius for a very short column', () => {
		expect(columnPath(0, 100, 20, 2)).toContain('V100');
		expect(columnPath(0, 100, 20, 2)).not.toContain('NaN');
	});
});

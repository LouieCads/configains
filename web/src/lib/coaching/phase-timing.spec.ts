import { describe, expect, it } from 'vitest';
import { phaseTiming, phaseTimingLabel } from './phase-timing';

const now = new Date('2026-11-12T12:00:00Z');
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();

describe('phaseTiming', () => {
	it('counts weeks from the phase start', () => {
		expect(phaseTiming(daysAgo(0), 4, now)).toEqual({
			week: 1,
			weeks: 4,
			due: false,
			overdueDays: 0
		});
		expect(phaseTiming(daysAgo(8), 4, now)).toMatchObject({ week: 2, due: false });
	});

	it('is due once the planned length has passed', () => {
		expect(phaseTiming(daysAgo(28), 4, now)).toMatchObject({ due: true, overdueDays: 0, week: 4 });
		expect(phaseTiming(daysAgo(31), 4, now)).toMatchObject({ due: true, overdueDays: 3 });
	});

	it('is never due without a planned length', () => {
		expect(phaseTiming(daysAgo(400), null, now)).toMatchObject({ due: false, weeks: null });
	});

	it('treats a future or unreadable start as starting now', () => {
		expect(phaseTiming(daysAgo(-5), 2, now)).toMatchObject({ week: 1, due: false });
		expect(phaseTiming('not a date', 2, now)).toMatchObject({ week: 1, due: false });
	});
});

describe('phaseTimingLabel', () => {
	it('describes progress, a due phase and a finished program', () => {
		expect(phaseTimingLabel(phaseTiming(daysAgo(8), 4, now), false)).toBe('Week 2 of 4');
		expect(phaseTimingLabel(phaseTiming(daysAgo(29), 4, now), false)).toBe(
			'Due for next phase (1 day ago)'
		);
		expect(phaseTimingLabel(phaseTiming(daysAgo(28), 4, now), true)).toBe(
			'Program finished (today)'
		);
		expect(phaseTimingLabel(phaseTiming(daysAgo(3), null, now), false)).toBe('Week 1');
	});
});

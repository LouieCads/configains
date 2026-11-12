const dayMs = 24 * 60 * 60 * 1000;

export type PhaseTiming = {
	/** 1-based week of the phase the client is in now. */
	week: number;
	/** Planned length, or null when the phase has none. */
	weeks: number | null;
	/** The planned length has passed. */
	due: boolean;
	/** Days since the planned end. 0 on the day it ends. */
	overdueDays: number;
};

/** Where a client is in their current phase. Without a planned length it is never due. */
export function phaseTiming(
	startedAt: string | Date,
	durationWeeks: number | null | undefined,
	now: Date = new Date()
): PhaseTiming {
	const started = new Date(startedAt).getTime();
	const elapsed = Math.max(0, now.getTime() - (Number.isFinite(started) ? started : now.getTime()));
	const week = Math.floor(elapsed / (7 * dayMs)) + 1;
	if (!durationWeeks || durationWeeks < 1) return { week, weeks: null, due: false, overdueDays: 0 };
	const end = durationWeeks * 7 * dayMs;
	const due = elapsed >= end;
	return {
		week: Math.min(week, durationWeeks),
		weeks: durationWeeks,
		due,
		overdueDays: due ? Math.floor((elapsed - end) / dayMs) : 0
	};
}

/** Short text for the coach, for example "Week 2 of 4" or "Due for next phase (3 days ago)". */
export function phaseTimingLabel(timing: PhaseTiming, isLastPhase: boolean): string {
	if (!timing.weeks) return `Week ${timing.week}`;
	if (!timing.due) return `Week ${timing.week} of ${timing.weeks}`;
	const ago =
		timing.overdueDays === 0
			? 'today'
			: `${timing.overdueDays} day${timing.overdueDays === 1 ? '' : 's'} ago`;
	return isLastPhase ? `Program finished (${ago})` : `Due for next phase (${ago})`;
}

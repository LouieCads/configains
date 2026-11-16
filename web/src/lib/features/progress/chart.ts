// Small helpers shared by the dashboard charts. Pure, so they can be tested without a browser.

/** Clean tick values covering [min, max]: steps of 1, 2 or 5 times a power of ten. */
export function niceTicks(min: number, max: number, count = 4): number[] {
	let low = min;
	let high = max;
	if (!(high > low)) {
		// A flat series still needs a visible range.
		const pad = Math.abs(low) * 0.05 || 1;
		low -= pad;
		high += pad;
	}
	const rough = (high - low) / Math.max(1, count);
	const magnitude = 10 ** Math.floor(Math.log10(rough));
	const residual = rough / magnitude;
	const step = (residual < 1.5 ? 1 : residual < 3 ? 2 : residual < 7 ? 5 : 10) * magnitude;
	const first = Math.floor(low / step + 1e-9) * step;
	const last = Math.ceil(high / step - 1e-9) * step;
	const ticks: number[] = [];
	for (let value = first; value <= last + step / 2; value += step)
		ticks.push(Number(value.toFixed(10)));
	return ticks;
}

/** 8,000 in full below 10,000 and 12.5K above, one style per axis. */
export function formatAxis(value: number, compact: boolean): string {
	if (compact && Math.abs(value) >= 1000) {
		const thousands = value / 1000;
		return `${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)}K`;
	}
	return value.toLocaleString('en-GB', { maximumFractionDigits: 2 });
}

export function formatNumber(value: number, decimals = 0): string {
	return value.toLocaleString('en-GB', {
		minimumFractionDigits: 0,
		maximumFractionDigits: decimals
	});
}

/** Always shows the decimals: 84.0, not 84. For figures people compare week to week. */
export function formatFixed(value: number, decimals = 1): string {
	return value.toLocaleString('en-GB', {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals
	});
}

/** "+1.2", "−0.8" or "0": a signed change with a real minus sign. */
export function signed(value: number, decimals = 1): string {
	const text = formatNumber(Math.abs(value), decimals);
	if (value === 0 || text === '0') return '0';
	return `${value > 0 ? '+' : '−'}${text}`;
}

/** Index of the value in `positions` closest to `x`. -1 when empty. */
export function nearestIndex(positions: number[], x: number): number {
	let best = -1;
	let distance = Infinity;
	positions.forEach((position, index) => {
		const gap = Math.abs(position - x);
		if (gap < distance) {
			distance = gap;
			best = index;
		}
	});
	return best;
}

const utc = (iso: string) => new Date(`${iso}T00:00:00Z`);

/** "12 Nov" */
export function shortDate(iso: string): string {
	return utc(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

/** "Thu 12 Nov" */
export function longDate(iso: string): string {
	return utc(iso).toLocaleDateString('en-GB', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		timeZone: 'UTC'
	});
}

/** The date `fraction` of the way from `from` to `to` (both ISO dates), as an ISO date. */
export function dateBetween(from: string, to: string, fraction: number): string {
	const start = utc(from).getTime();
	const end = utc(to).getTime();
	return new Date(start + (end - start) * fraction).toISOString().slice(0, 10);
}

/** A column path with a rounded top and a square base, for bars growing from a baseline. */
export function columnPath(x: number, base: number, width: number, height: number, radius = 4) {
	if (height <= 0) return '';
	const r = Math.min(radius, height, width / 2);
	const top = base - height;
	return `M${x},${base}V${top + r}Q${x},${top} ${x + r},${top}H${x + width - r}Q${x + width},${top} ${x + width},${top + r}V${base}Z`;
}

<script lang="ts">
	// One series over time: a 2px line, an end dot with a label, a crosshair and tooltip on hover or
	// arrow keys. The date axis is to scale, so a gap between weigh-ins shows as a gap.
	import { dateBetween, formatNumber, longDate, nearestIndex, niceTicks, shortDate } from './chart';

	type Point = { date: string; value: number };
	let {
		points,
		unit = '',
		label,
		decimals = 1
	}: { points: Point[]; unit?: string; label: string; decimals?: number } = $props();

	const height = 220;
	const margin = { top: 28, right: 18, bottom: 28, left: 46 };
	let width = $state(600);
	let active = $state<number | null>(null);

	const plotWidth = $derived(Math.max(40, width - margin.left - margin.right));
	const plotHeight = height - margin.top - margin.bottom;
	const first = $derived(points[0]?.date);
	const last = $derived(points.at(-1)?.date);
	const span = $derived(first && last ? Date.parse(last) - Date.parse(first) : 0);

	const ticks = $derived(
		points.length
			? niceTicks(
					Math.min(...points.map((point) => point.value)),
					Math.max(...points.map((point) => point.value)),
					4
				)
			: [0, 1]
	);
	const low = $derived(ticks[0]);
	const high = $derived(ticks.at(-1) ?? 1);

	const xOf = (date: string) =>
		margin.left +
		(span === 0 ? plotWidth / 2 : ((Date.parse(date) - Date.parse(first!)) / span) * plotWidth);
	const yOf = (value: number) =>
		margin.top + plotHeight - ((value - low) / (high - low || 1)) * plotHeight;

	const xs = $derived(points.map((point) => xOf(point.date)));
	const line = $derived(
		points
			.map((point, index) => `${index === 0 ? 'M' : 'L'}${xs[index]},${yOf(point.value)}`)
			.join('')
	);
	const area = $derived(
		points.length > 1
			? `${line}L${xs.at(-1)},${margin.top + plotHeight}L${xs[0]},${margin.top + plotHeight}Z`
			: ''
	);

	// Date labels along the bottom, spaced so they never touch.
	const xLabels = $derived.by(() => {
		if (!first || !last) return [];
		if (span === 0) return [{ x: xOf(first), text: shortDate(first) }];
		const count = Math.max(2, Math.min(5, Math.floor(plotWidth / 90)));
		return Array.from({ length: count }, (_, index) => {
			const date = dateBetween(first, last, index / (count - 1));
			return { x: xOf(date), text: shortDate(date) };
		});
	});

	const end = $derived(points.at(-1));
	// The line meets the end dot from above when the last step went down, so the label goes below it
	// (unless that would run into the date axis).
	const labelBelow = $derived(
		Boolean(
			end &&
			(points.at(-2)?.value ?? -Infinity) > end.value &&
			yOf(end.value) + 24 < margin.top + plotHeight + 10
		)
	);
	const shown = $derived(active === null ? null : (points[active] ?? null));
	const text = (value: number) => `${formatNumber(value, decimals)}${unit ? ` ${unit}` : ''}`;

	function move(event: PointerEvent) {
		const box = (event.currentTarget as SVGElement).getBoundingClientRect();
		const index = nearestIndex(xs, event.clientX - box.left);
		active = index < 0 ? null : index;
	}
	function key(event: KeyboardEvent) {
		if (!points.length) return;
		const current = active ?? points.length - 1;
		const next =
			event.key === 'ArrowLeft'
				? Math.max(0, current - 1)
				: event.key === 'ArrowRight'
					? Math.min(points.length - 1, current + 1)
					: event.key === 'Home'
						? 0
						: event.key === 'End'
							? points.length - 1
							: null;
		if (next === null) return;
		event.preventDefault();
		active = next;
	}
</script>

<div class="relative" bind:clientWidth={width}>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
	<!-- The chart is focusable so arrow keys can step through its values; the table view is the full equivalent. -->
	<svg
		{width}
		{height}
		role="group"
		aria-label={label}
		tabindex="0"
		class="block touch-pan-y overflow-visible"
		onpointermove={move}
		onpointerleave={() => (active = null)}
		onkeydown={key}
		onfocus={() => (active ??= points.length ? points.length - 1 : null)}
		onblur={() => (active = null)}
	>
		<!-- Hairline grid and y values -->
		{#each ticks as tick (tick)}
			<line
				x1={margin.left}
				x2={margin.left + plotWidth}
				y1={yOf(tick)}
				y2={yOf(tick)}
				class="stroke-line"
				stroke-width="1"
			/>
			<text
				x={margin.left - 8}
				y={yOf(tick)}
				dy="0.32em"
				text-anchor="end"
				class="fill-muted text-[11px] tabular-nums">{formatNumber(tick, decimals)}</text
			>
		{/each}
		{#each xLabels as tick, index (index)}
			<text
				x={tick.x}
				y={height - 8}
				text-anchor={xLabels.length > 1 && index === 0
					? 'start'
					: xLabels.length > 1 && index === xLabels.length - 1
						? 'end'
						: 'middle'}
				class="fill-muted text-[11px]">{tick.text}</text
			>
		{/each}

		{#if area}<path d={area} class="fill-cyan-ink/10" />{/if}
		{#if points.length > 1}
			<path
				d={line}
				fill="none"
				class="stroke-cyan-ink"
				stroke-width="2"
				stroke-linejoin="round"
				stroke-linecap="round"
			/>
		{/if}

		<!-- Crosshair and the point under it -->
		{#if shown}
			<line
				x1={xOf(shown.date)}
				x2={xOf(shown.date)}
				y1={margin.top}
				y2={margin.top + plotHeight}
				class="stroke-ink-soft/40"
				stroke-width="1"
			/>
			<circle cx={xOf(shown.date)} cy={yOf(shown.value)} r="6.5" class="fill-paper" />
			<circle cx={xOf(shown.date)} cy={yOf(shown.value)} r="4.5" class="fill-cyan-ink" />
		{:else if end}
			<!-- End dot with a 2px ring in the surface colour, and the latest value above it -->
			<circle cx={xOf(end.date)} cy={yOf(end.value)} r="6.5" class="fill-paper" />
			<circle cx={xOf(end.date)} cy={yOf(end.value)} r="4.5" class="fill-cyan-ink" />
			<text
				x={xOf(end.date)}
				y={yOf(end.value) + (labelBelow ? 24 : -12)}
				text-anchor={xOf(end.date) > margin.left + plotWidth - 30 ? 'end' : 'middle'}
				class="fill-ink stroke-paper text-[12px] font-semibold [paint-order:stroke]"
				stroke-width="3">{text(end.value)}</text
			>
		{/if}
	</svg>

	{#if shown}
		<div
			class="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md border border-line bg-paper px-3 py-1.5 text-[0.8rem] whitespace-nowrap shadow-sm"
			style:left="{Math.min(Math.max(xOf(shown.date), 70), width - 70)}px"
		>
			<span class="text-muted">{longDate(shown.date)}</span>
			<strong class="ml-2">{text(shown.value)}</strong>
		</div>
		<span class="sr-only" aria-live="polite">{longDate(shown.date)}: {text(shown.value)}</span>
	{/if}
</div>

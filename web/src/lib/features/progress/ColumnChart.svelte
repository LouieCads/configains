<script lang="ts">
	// One value per period as thin columns growing from a baseline, with an optional target line.
	// With a target, columns that reach it are the accent colour and the rest are a quieter slate, and a
	// legend says so. Hover, touch or arrow keys show the exact figure for a column.
	import { columnPath, formatAxis, formatNumber, niceTicks } from './chart';

	type Bar = {
		/** Short text under the column, e.g. "12" or "9 Nov". */
		tick: string;
		value: number | null;
		/** Whether this column reached the target. Null when there is no target or no value. */
		met?: boolean | null;
		/** What the tooltip says, e.g. "Thu 12 Nov: 9,100 steps". */
		detail: string;
	};
	let {
		bars,
		target = null,
		targetLabel = 'Target',
		label,
		unit = ''
	}: {
		bars: Bar[];
		target?: number | null;
		targetLabel?: string;
		label: string;
		unit?: string;
	} = $props();

	const height = 200;
	const margin = { top: 24, right: 12, bottom: 26, left: 46 };
	let width = $state(600);
	let active = $state<number | null>(null);

	const plotWidth = $derived(Math.max(40, width - margin.left - margin.right));
	const plotHeight = height - margin.top - margin.bottom;
	const base = margin.top + plotHeight;

	const top = $derived(Math.max(0, target ?? 0, ...bars.map((bar) => bar.value ?? 0)));
	const ticks = $derived(niceTicks(0, top, 4));
	const high = $derived(ticks.at(-1) ?? 1);
	const compact = $derived(high >= 10_000);
	const yOf = (value: number) => base - (value / high) * plotHeight;

	const slot = $derived(plotWidth / Math.max(1, bars.length));
	const barWidth = $derived(Math.min(24, slot * 0.6));
	const xOf = (index: number) => margin.left + slot * index + (slot - barWidth) / 2;
	// Labels keep at least ~34px apart; the last column always keeps its label.
	const every = $derived(Math.max(1, Math.ceil(34 / slot)));
	const showTick = (index: number) => (bars.length - 1 - index) % every === 0;

	const hasLegend = $derived(
		target !== null && bars.some((bar) => bar.met !== null && bar.met !== undefined)
	);
	const colour = (bar: Bar) => (bar.met === false ? 'fill-[#75929a]' : 'fill-cyan-ink');

	function key(event: KeyboardEvent) {
		if (!bars.length) return;
		const current = active ?? bars.length - 1;
		const next =
			event.key === 'ArrowLeft'
				? Math.max(0, current - 1)
				: event.key === 'ArrowRight'
					? Math.min(bars.length - 1, current + 1)
					: event.key === 'Home'
						? 0
						: event.key === 'End'
							? bars.length - 1
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
		onpointerleave={() => (active = null)}
		onkeydown={key}
		onfocus={() => (active ??= bars.length ? bars.length - 1 : null)}
		onblur={() => (active = null)}
	>
		{#each ticks as tick (tick)}
			<line
				x1={margin.left}
				x2={margin.left + plotWidth}
				y1={yOf(tick)}
				y2={yOf(tick)}
				class={tick === 0 ? 'stroke-[#c9d6d3]' : 'stroke-line'}
				stroke-width="1"
			/>
			<text
				x={margin.left - 8}
				y={yOf(tick)}
				dy="0.32em"
				text-anchor="end"
				class="fill-muted text-[11px] tabular-nums">{formatAxis(tick, compact)}</text
			>
		{/each}

		{#each bars as bar, index (index)}
			{#if showTick(index)}
				<text
					x={xOf(index) + barWidth / 2}
					y={height - 8}
					text-anchor="middle"
					class="fill-muted text-[11px]">{bar.tick}</text
				>
			{/if}
			{#if bar.value !== null && bar.value > 0}
				<path
					d={columnPath(xOf(index), base, barWidth, (bar.value / high) * plotHeight)}
					class={colour(bar)}
					opacity={active === null || active === index ? 1 : 0.55}
				/>
			{/if}
		{/each}

		{#if target !== null}
			<line
				x1={margin.left}
				x2={margin.left + plotWidth}
				y1={yOf(target)}
				y2={yOf(target)}
				class="stroke-ink-soft"
				stroke-width="1.5"
			/>
			<text
				x={margin.left + plotWidth}
				y={yOf(target) - 6}
				text-anchor="end"
				class="fill-ink-soft stroke-paper text-[11px] font-semibold [paint-order:stroke]"
				stroke-width="3">{targetLabel} {formatNumber(target)}{unit ? ` ${unit}` : ''}</text
			>
		{/if}

		<!-- Each column's hit area is its whole slot, so it is easy to land on, including on a phone. -->
		{#each { length: bars.length }, index (index)}
			<rect
				x={margin.left + slot * index}
				y={margin.top}
				width={slot}
				height={plotHeight}
				fill="transparent"
				role="presentation"
				onpointerenter={() => (active = index)}
				onpointerdown={() => (active = index)}
			/>
		{/each}
	</svg>

	{#if active !== null && bars[active]}
		<div
			class="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md border border-line bg-paper px-3 py-1.5 text-[0.8rem] whitespace-nowrap shadow-sm"
			style:left="{Math.min(Math.max(margin.left + slot * active + slot / 2, 80), width - 80)}px"
		>
			{bars[active].detail}
		</div>
		<span class="sr-only" aria-live="polite">{bars[active].detail}</span>
	{/if}

	{#if hasLegend}
		<ul class="m-0 mt-2 flex list-none flex-wrap gap-x-5 gap-y-1 p-0 text-[0.8rem] text-muted">
			<li class="inline-flex items-center gap-2">
				<span class="size-2.5 rounded-xs bg-cyan-ink" aria-hidden="true"></span>Reached {targetLabel.toLowerCase()}
			</li>
			<li class="inline-flex items-center gap-2">
				<span class="size-2.5 rounded-xs bg-[#75929a]" aria-hidden="true"></span>Below
			</li>
			<li class="inline-flex items-center gap-2">
				<span class="h-0.5 w-4 bg-ink-soft" aria-hidden="true"></span>{targetLabel}
			</li>
		</ul>
	{/if}
</div>

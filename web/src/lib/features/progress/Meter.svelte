<script lang="ts">
	// A ratio against a limit: what was done against what was asked. The track is a lighter step of
	// the fill's own colour, and reaching the goal adds a check and the word "Done", not colour alone.
	import Check from '@lucide/svelte/icons/check';

	let {
		label,
		value,
		max,
		valueText,
		hints = []
	}: {
		label: string;
		value: number;
		max: number;
		/** The figure beside the label, e.g. "2 of 4". Shown in bold. */
		valueText: string;
		/** Supporting facts, one line each. */
		hints?: string[];
	} = $props();

	const percent = $derived(max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0);
	const done = $derived(max > 0 && value >= max);
</script>

<div class="grid gap-1.5">
	<div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
		<span class="text-[0.9rem] text-muted">{label}</span>
		<span class="inline-flex items-center gap-2">
			<strong>{valueText}</strong>
			{#if done}<span class="inline-flex items-center gap-1 font-semibold text-[#175e4d]"
					><Check size={15} aria-hidden="true" />Done</span
				>{/if}
		</span>
	</div>
	<div
		class="h-2.5 overflow-hidden rounded-full bg-mist"
		role="progressbar"
		aria-label={label}
		aria-valuemin="0"
		aria-valuemax={max}
		aria-valuenow={Math.min(value, max)}
		aria-valuetext={valueText}
	>
		<div class="h-full rounded-full bg-cyan-ink" style:width="{percent}%"></div>
	</div>
	{#each hints as hint (hint)}<p class="m-0 text-[0.8rem] text-muted">{hint}</p>{/each}
</div>

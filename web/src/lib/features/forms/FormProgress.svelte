<script lang="ts">
	import { fillTemplate, percentComplete } from './progress';

	type Props = {
		/** One-based step the visitor is on. */
		current: number;
		/** Number of steps in the form. */
		total: number;
		/** Templates using `{current}`, `{total}` and `{percent}`. */
		counterText: string;
		percentText: string;
		/** Accessible name for the bar. */
		label: string;
	};
	let { current, total, counterText, percentText, label }: Props = $props();
	const percent = $derived(percentComplete(current, total));
	const values = $derived({ current, total, percent });
	const counter = $derived(fillTemplate(counterText, values));
	const percentage = $derived(fillTemplate(percentText, values));
</script>

<div class="mb-3">
	<div
		class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 font-display text-[1.125rem]/none tracking-[0.12em] text-ink uppercase"
	>
		<span>{counter}</span><span class="text-cyan-deep">{percentage}</span>
	</div>
	<div
		class="mt-2 h-[5px] overflow-hidden bg-ink/12"
		role="progressbar"
		aria-label={label}
		aria-valuemin="0"
		aria-valuemax="100"
		aria-valuenow={percent}
		aria-valuetext="{counter}, {percentage}"
	>
		<div
			class="h-full bg-cyan [transition:width_0.45s_cubic-bezier(0.22,1,0.36,1)] motion-reduce:[transition:none]"
			style:width="{percent}%"
		></div>
	</div>
</div>

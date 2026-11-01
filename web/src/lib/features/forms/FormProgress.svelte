<script lang="ts">
	import { fillTemplate, percentComplete } from './progress';

	type Props = {
		/** One-based step the visitor is on. */
		current: number;
		/** Names of every step, in order. */
		steps: { title: string }[];
		/** Furthest zero-based step that can be opened from the list. */
		reached: number;
		/** Templates using `{current}`, `{total}` and `{percent}`. */
		counterText: string;
		percentText: string;
		/** Accessible names for the bar and the step list. */
		label: string;
		stepsLabel: string;
		onselect: (index: number) => void;
	};
	let { current, steps, reached, counterText, percentText, label, stepsLabel, onselect }: Props =
		$props();
	const total = $derived(steps.length);
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
	<!-- One line: only the current step shows its name; the others are numbers with a tooltip. -->
	<ol class="m-0 mt-1 flex list-none flex-wrap gap-x-5 p-0" aria-label={stepsLabel}>
		{#each steps as step, index (index)}
			{@const active = index === current - 1}
			<li class="min-w-0">
				<button
					type="button"
					title={step.title}
					class="group relative inline-flex min-h-9 cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-left text-[0.875rem] leading-[1.3] text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-cyan-ink disabled:cursor-default disabled:text-ink-soft/55 {active
						? "after:absolute after:inset-x-0 after:bottom-[3px] after:h-[3px] after:bg-cyan after:content-['']"
						: ''}"
					aria-current={active ? 'step' : undefined}
					disabled={index > reached && !active}
					onclick={() => onselect(index)}
				>
					<span class="font-display text-[1.125rem]/none tracking-[0.1em] text-cyan-deep"
						>{String(index + 1).padStart(2, '0')}</span
					><span class={active ? '' : 'sr-only'}>{step.title}</span>
				</button>
			</li>
		{/each}
	</ol>
</div>

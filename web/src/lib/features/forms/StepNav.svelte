<script lang="ts">
	import Check from '@lucide/svelte/icons/check';

	// Numbered step list, like the question palette in an online exam: each step already reached is
	// a button that jumps straight back to it, and steps not reached yet stay locked.
	type Props = {
		labels: string[];
		/** Zero-based step being filled in. */
		current: number;
		/** Furthest zero-based step the person may open. */
		reached: number;
		onjump: (step: number) => void;
		/** Accessible name for the list. */
		label: string;
	};
	let { labels, current, reached, onjump, label }: Props = $props();

	const base =
		'flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full border px-3 text-[0.9rem] font-semibold';
	function look(index: number) {
		if (index === current) return `${base} border-cyan-ink bg-cyan text-ink`;
		if (index <= reached)
			return `${base} cursor-pointer border-cyan-ink bg-transparent text-cyan-deep hover:bg-mist`;
		return `${base} cursor-not-allowed border-line bg-transparent text-muted opacity-60`;
	}
</script>

<nav aria-label={label}>
	<ol class="m-0 flex list-none flex-wrap gap-2 p-0">
		{#each labels as name, index (index)}
			<li>
				<button
					type="button"
					class={look(index)}
					aria-current={index === current ? 'step' : undefined}
					disabled={index > reached && index !== current}
					onclick={() => onjump(index)}
				>
					{#if index < reached && index !== current}<Check
							size={16}
							aria-hidden="true"
						/>{:else}<span aria-hidden="true">{index + 1}</span>{/if}
					<!-- On a phone only the open step shows its name, so all the steps fit on one row. -->
					<span class={index === current ? '' : 'sr-only'}>{name}</span>
				</button>
			</li>
		{/each}
	</ol>
</nav>

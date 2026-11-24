<script lang="ts" module>
	import type { LucideIcon } from '@lucide/svelte';

	/** One figure: a plain icon, the value in bold, and the words around it. */
	export type Fact = {
		icon: LucideIcon;
		value: string;
		/** Words before the value, e.g. "RIR". */
		lead?: string;
		/** Words after the value, e.g. "min". */
		trail?: string;
	};
</script>

<script lang="ts">
	// Figures that belong together on one line, each with its own icon at the left instead of being
	// separated by commas. The icons are bare: no border and no fill.
	let { facts }: { facts: Fact[] } = $props();
</script>

{#if facts.length > 0}
	<ul class="m-0 flex list-none flex-wrap items-center gap-x-4 gap-y-1 p-0">
		{#each facts as fact, index (index)}
			<li class="inline-flex items-center gap-1.5">
				<fact.icon size={15} class="shrink-0 text-cyan-deep" aria-hidden="true" />
				<span
					>{#if fact.lead}{fact.lead}
					{/if}<strong>{fact.value}</strong>{#if fact.trail}
						{fact.trail}{/if}</span
				>
			</li>
		{/each}
	</ul>
{/if}

<script lang="ts">
	import { mark } from './styles';
	let {
		id,
		heading,
		tone = 'light',
		fit,
		class: className = ''
	}: {
		id: string;
		heading: { first: string; accent: string };
		/** `dark` sits on night, `cyan` on the cyan band; both keep the swipe readable. */
		tone?: 'light' | 'dark' | 'cyan';
		/**
		 * Keep each line on one row: size the heading to its column at this many
		 * `cqi` (percent of the column width), capped at `max`. Overrides the default size.
		 */
		fit?: { cqi: number; max: string };
		class?: string;
	} = $props();
</script>

{#snippet title()}
	<h2
		{id}
		class={[tone === 'dark' && 'text-bone', fit && 'whitespace-nowrap', className]}
		style:font-size={fit ? `clamp(2rem, ${fit.cqi}cqi, ${fit.max})` : undefined}
	>
		{heading.first}{#if heading.accent}<br /><span
				class={tone === 'dark'
					? 'text-cyan'
					: [mark, tone === 'cyan' && '[--mark:var(--color-bone)]']}
				data-mark={tone === 'dark' ? undefined : ''}>{heading.accent}</span
			>{/if}
	</h2>
{/snippet}

{#if fit}<div class="@container">{@render title()}</div>{:else}{@render title()}{/if}

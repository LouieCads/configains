<script lang="ts">
	import { mark } from './styles';
	let {
		id,
		heading,
		tone = 'light',
		fit,
		oneLine = false,
		class: className = ''
	}: {
		id: string;
		heading: { first: string; accent: string };
		/** `dark` sits on night, `cyan` on the cyan band; both keep the swipe readable. */
		tone?: 'light' | 'dark' | 'cyan';
		/**
		 * Size the heading to its column at this many `cqi` (percent of the column
		 * width), capped at `max`. Without it the size is worked out from the
		 * longest line, so each line stays on one row whatever the CMS text is.
		 */
		fit?: { cqi: number; max: string };
		/** Show both parts on a single row instead of two. */
		oneLine?: boolean;
		class?: string;
	} = $props();

	/** Roughly how many `cqi` of display type one line can hold before it overflows. */
	const lineBudget = 220;
	const size = $derived.by(() => {
		if (fit) return fit;
		const longest = oneLine
			? heading.first.length + heading.accent.length + 1
			: Math.max(heading.first.length, heading.accent.length);
		return { cqi: Math.min(18, lineBudget / Math.max(longest, 1)), max: '5rem' };
	});
</script>

<div class="@container">
	<h2
		{id}
		class={[tone === 'dark' && 'text-bone', 'whitespace-nowrap', className]}
		style:font-size={`clamp(${oneLine ? '1.25rem' : '2rem'}, ${size.cqi.toFixed(2)}cqi, ${size.max})`}
	>
		{oneLine && heading.accent
			? `${heading.first} `
			: heading.first}{#if heading.accent}{#if !oneLine}<br />{/if}<span
				class={tone === 'dark'
					? 'text-cyan'
					: [mark, tone === 'cyan' && '[--mark:var(--color-bone)]']}
				data-mark={tone === 'dark' ? undefined : ''}>{heading.accent}</span
			>{/if}
	</h2>
</div>

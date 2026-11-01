<script lang="ts">
	import { mark } from './styles';
	let {
		id,
		heading,
		tone = 'light',
		class: className = ''
	}: {
		id: string;
		heading: { first: string; accent: string };
		/** `dark` sits on night, `cyan` on the cyan band; both keep the swipe readable. */
		tone?: 'light' | 'dark' | 'cyan';
		class?: string;
	} = $props();
</script>

<h2 {id} class={[tone === 'dark' && 'text-bone', className]}>
	{heading.first}{#if heading.accent}<br /><span
			class={tone === 'dark'
				? 'text-cyan'
				: [mark, tone === 'cyan' && '[--mark:var(--color-bone)]']}
			data-mark={tone === 'dark' ? undefined : ''}>{heading.accent}</span
		>{/if}
</h2>

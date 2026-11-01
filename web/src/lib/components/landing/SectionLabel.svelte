<script lang="ts">
	import type { Snippet } from 'svelte';
	import { labelSpacing, labelText } from './styles';
	let {
		number,
		tone = 'light',
		children
	}: { number?: string; tone?: 'light' | 'dark'; children: Snippet } = $props();
</script>

<p class="{labelText} {labelSpacing} {tone === 'dark' ? 'text-[#b6cdd1]' : 'text-ink'}">
	{#if number}<span class={tone === 'dark' ? 'text-cyan' : 'text-cyan-deep'}>{number}</span><span
			class="h-px w-9 bg-current opacity-40"
			aria-hidden="true"
		></span>{/if}{@render children()}
</p>

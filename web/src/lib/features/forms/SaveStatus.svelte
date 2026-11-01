<script lang="ts">
	import type { SaveStatus } from './step-flow.svelte';

	let {
		status,
		savingText,
		savedText
	}: { status: SaveStatus; savingText: string; savedText: string } = $props();
</script>

<!-- A live region that is always present so screen readers announce each change. -->
<span class="inline-flex min-h-6 items-center gap-2 text-[0.8125rem] text-ink-soft" role="status">
	{#if status === 'saving'}
		<span class="size-[7px] animate-pulse rounded-full bg-cyan-deep" aria-hidden="true"
		></span>{savingText}
	{:else if status === 'saved'}
		<svg
			class="size-3.5 text-cyan-deep"
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"><path d="m3 8.5 3.2 3L13 4.5" /></svg
		>{savedText}
	{/if}
</span>

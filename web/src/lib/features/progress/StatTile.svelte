<script lang="ts">
	// A single figure with an optional change. Direction is shown with an arrow and a sign, never colour
	// alone, and only a change that is good by definition (strength up) is tinted. Weight is neutral:
	// whether up or down is good depends on the client's goal.
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import Minus from '@lucide/svelte/icons/minus';

	let {
		label,
		value,
		unit = '',
		change = null,
		changeLabel = '',
		tone = 'neutral'
	}: {
		label: string;
		value: string;
		unit?: string;
		/** Signed text such as "−0.8 kg", with its direction. */
		change?: { text: string; direction: 'up' | 'down' | 'flat' } | null;
		changeLabel?: string;
		tone?: 'neutral' | 'good';
	} = $props();
</script>

<div class="min-w-0 rounded-lg border border-line p-4">
	<p class="m-0 text-[0.75rem] font-bold tracking-[1px] text-muted uppercase">{label}</p>
	<p class="m-0 mt-1 text-[1.75rem] leading-tight font-bold">
		{value}{#if unit}<span class="ml-1 text-[1rem] font-semibold text-muted">{unit}</span>{/if}
	</p>
	{#if change}
		<p
			class={[
				'm-0 mt-1 inline-flex flex-wrap items-center gap-x-1.5 text-[0.85rem]',
				tone === 'good' && change.direction === 'up' ? 'text-[#175e4d]' : 'text-ink-soft'
			]}
		>
			{#if change.direction === 'up'}<ArrowUp
					size={15}
					aria-hidden="true"
				/>{:else if change.direction === 'down'}<ArrowDown
					size={15}
					aria-hidden="true"
				/>{:else}<Minus size={15} aria-hidden="true" />{/if}
			<span class="font-semibold">{change.text}</span>
			{#if changeLabel}<span class="text-muted">{changeLabel}</span>{/if}
		</p>
	{/if}
</div>

<script lang="ts">
	import { homeSections, orderedHomeSections } from '$lib/content/home-sections';
	let { value = $bindable(), disabled = false }: { value: string[]; disabled?: boolean } = $props();
	let announcement = $state('');
	const sections = $derived(orderedHomeSections(value));
	function move(index: number, direction: number) {
		const order = [...sections];
		const target = index + direction;
		if (disabled || target < 0 || target >= order.length) return;
		[order[index], order[target]] = [order[target], order[index]];
		value = order;
		announcement = `${homeSections.find((section) => section.id === order[target])?.label} moved to position ${target + 1}.`;
	}
</script>

<fieldset class="section-order" {disabled}>
	<legend>Homepage section order</legend>
	<p class="editor-help">
		Move sections up or down to change their position on the homepage. Save your draft and preview
		the arrangement before publishing. Sections switched off in their settings stay hidden.
	</p>
	<ol>
		{#each sections as id, index (id)}
			{@const label = homeSections.find((section) => section.id === id)!.label}
			<li>
				<span class="section-order-number">{index + 1}</span>
				<strong>{label}</strong>
				<button
					type="button"
					class="cms-secondary"
					aria-label={`Move ${label} up`}
					disabled={disabled || index === 0}
					onclick={() => move(index, -1)}>↑</button
				>
				<button
					type="button"
					class="cms-secondary"
					aria-label={`Move ${label} down`}
					disabled={disabled || index === sections.length - 1}
					onclick={() => move(index, 1)}>↓</button
				>
			</li>
		{/each}
	</ol>
	<p class="cms-visually-hidden" aria-live="polite">{announcement}</p>
</fieldset>

<style>
	.section-order {
		border: 0;
		padding: 0;
		margin: 0 0 24px;
		min-width: 0;
	}
	legend {
		font-size: 1.5rem;
	}
	ol {
		list-style: none;
		padding: 0;
		display: grid;
		gap: 8px;
		margin-top: 18px;
	}
	li {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px;
		border: 1px solid #d4dfe0;
		border-radius: 8px;
		background: #fff;
	}
	strong {
		flex: 1;
		font-size: 0.875rem;
	}
	.section-order-number {
		min-width: 24px;
		color: #56676b;
		font-size: 0.8rem;
	}
	li button {
		padding: 8px;
		min-width: 44px;
	}
</style>

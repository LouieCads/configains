<!--
	Reorders homepage sections by dragging or with up/down buttons. Missing or
	unknown ids in `value` are repaired on display; moves are announced to screen readers.
-->
<script lang="ts">
	import { homeSections, orderedHomeSections } from '$lib/content/home-sections';
	let { value = $bindable(), disabled = false }: { value: string[]; disabled?: boolean } = $props();
	let announcement = $state('');
	let dragIndex = $state<number | null>(null);
	let dragOverIndex = $state<number | null>(null);
	const sections = $derived(orderedHomeSections(value));
	const labelOf = (id: string) => homeSections.find((section) => section.id === id)?.label ?? id;
	function reorder(from: number, to: number) {
		if (
			disabled ||
			from === to ||
			from < 0 ||
			to < 0 ||
			from >= sections.length ||
			to >= sections.length
		)
			return;
		const order = [...sections];
		const [moved] = order.splice(from, 1);
		order.splice(to, 0, moved);
		value = order;
		announcement = `${labelOf(moved)} moved to position ${to + 1}.`;
	}
	function move(index: number, direction: number) {
		reorder(index, index + direction);
	}
	function handleDragStart(event: DragEvent, index: number) {
		if (disabled) return;
		dragIndex = index;
		event.dataTransfer?.setData('text/plain', String(index));
		if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
	}
	function handleDragOver(event: DragEvent, index: number) {
		if (disabled || dragIndex === null) return;
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
		dragOverIndex = index;
	}
	function handleDrop(event: DragEvent, index: number) {
		event.preventDefault();
		if (disabled || dragIndex === null) return;
		reorder(dragIndex, index);
		dragIndex = null;
		dragOverIndex = null;
	}
	function handleDragEnd() {
		dragIndex = null;
		dragOverIndex = null;
	}
</script>

<fieldset class="section-order" {disabled}>
	<legend>Homepage section order</legend>
	<p class="editor-help">
		Drag a section to reorder it, or use the up/down buttons. Save your draft and preview the
		arrangement before publishing. Sections switched off in their settings stay hidden.
	</p>
	<ol>
		{#each sections as id, index (id)}
			{@const label = labelOf(id)}
			<li
				class:dragging={dragIndex === index}
				class:drag-over={dragOverIndex === index && dragIndex !== index}
				ondragover={(event) => handleDragOver(event, index)}
				ondrop={(event) => handleDrop(event, index)}
			>
				<span
					class="drag-handle"
					aria-hidden="true"
					draggable={!disabled}
					ondragstart={(event) => handleDragStart(event, index)}
					ondragend={handleDragEnd}>⠿</span
				>
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
	li.dragging {
		opacity: 0.5;
	}
	li.drag-over {
		border-color: #157f90;
		box-shadow: 0 0 0 1px #157f90;
	}
	strong {
		flex: 1;
		font-size: 0.875rem;
	}
	.drag-handle {
		cursor: grab;
		color: #99a9ab;
		font-size: 1rem;
		line-height: 1;
		padding: 4px;
		touch-action: none;
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

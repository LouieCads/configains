<!--
	Reorders homepage sections by dragging the handle, or by focusing it and
	pressing the up and down arrow keys. Missing or unknown ids in `value` are
	repaired on display; moves are announced to screen readers.
-->
<script lang="ts">
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import { tick } from 'svelte';
	import { homeSections, orderedHomeSections } from '$lib/content/home-sections';
	import { help, visuallyHidden } from './styles';
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
	let list = $state<HTMLOListElement>();
	/** Arrow keys on a focused handle move its section one place; focus follows it. */
	async function handleKey(event: KeyboardEvent, index: number) {
		const direction = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
		if (!direction) return;
		event.preventDefault();
		const id = sections[index];
		reorder(index, index + direction);
		await tick();
		list?.querySelector<HTMLButtonElement>(`[data-handle="${id}"]`)?.focus();
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

<fieldset class="m-0 mb-6 min-w-0 p-0 [border:0]" {disabled}>
	<legend class="text-[1.5rem]">Homepage section order</legend>
	<p class={help}>Drag the handle to reorder. The homepage and the editor tabs follow this order.</p>
	<ol bind:this={list} class="mt-[18px] grid list-none gap-2 p-0">
		{#each sections as id, index (id)}
			{@const label = labelOf(id)}
			<li
				class={[
					'flex items-center gap-2 rounded-lg border bg-white p-3',
					dragIndex === index && 'opacity-50',
					dragOverIndex === index && dragIndex !== index
						? 'border-cyan-ink [box-shadow:0_0_0_1px_#157f90]'
						: 'border-[#d4dfe0]'
				]}
				ondragover={(event) => handleDragOver(event, index)}
				ondrop={(event) => handleDrop(event, index)}
			>
				<button
					type="button"
					class="min-h-11 cursor-grab touch-none rounded-[6px] border-0 bg-transparent px-2 text-[1rem] leading-none text-[#99a9ab] hover:text-ink"
					title="Drag to reorder"
					aria-label={`Reorder ${label}. Use the up and down arrow keys.`}
					data-handle={id}
					draggable={!disabled}
					ondragstart={(event) => handleDragStart(event, index)}
					ondragend={handleDragEnd}
					onkeydown={(event) => handleKey(event, index)}
					><GripVertical size={18} aria-hidden="true" /></button
				>
				<span class="min-w-6 text-[0.8rem] text-muted">{index + 1}</span>
				<strong class="flex-1 text-[0.875rem]">{label}</strong>
			</li>
		{/each}
	</ol>
	<p class={visuallyHidden} aria-live="polite">{announcement}</p>
</fieldset>

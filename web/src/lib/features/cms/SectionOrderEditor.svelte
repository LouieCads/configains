<!--
	Reorders homepage sections by dragging or with up/down buttons. Missing or
	unknown ids in `value` are repaired on display; moves are announced to screen readers.
-->
<script lang="ts">
	import { homeSections, orderedHomeSections } from '$lib/content/home-sections';
	import { help, secondaryCompact, visuallyHidden } from './styles';
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

<fieldset class="m-0 mb-6 min-w-0 p-0 [border:0]" {disabled}>
	<legend class="text-[1.5rem]">Homepage section order</legend>
	<p class={help}>
		Drag a section to reorder it, or use the up/down buttons. Save your draft and preview the
		arrangement before publishing. Sections switched off in their settings stay hidden.
	</p>
	<ol class="mt-[18px] grid list-none gap-2 p-0">
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
				<span
					class="cursor-grab touch-none p-1 text-[1rem] leading-none text-[#99a9ab]"
					aria-hidden="true"
					draggable={!disabled}
					ondragstart={(event) => handleDragStart(event, index)}
					ondragend={handleDragEnd}>⠿</span
				>
				<span class="min-w-6 text-[0.8rem] text-muted">{index + 1}</span>
				<strong class="flex-1 text-[0.875rem]">{label}</strong>
				<button
					type="button"
					class={secondaryCompact}
					aria-label={`Move ${label} up`}
					disabled={disabled || index === 0}
					onclick={() => move(index, -1)}>↑</button
				>
				<button
					type="button"
					class={secondaryCompact}
					aria-label={`Move ${label} down`}
					disabled={disabled || index === sections.length - 1}
					onclick={() => move(index, 1)}>↓</button
				>
			</li>
		{/each}
	</ol>
	<p class={visuallyHidden} aria-live="polite">{announcement}</p>
</fieldset>

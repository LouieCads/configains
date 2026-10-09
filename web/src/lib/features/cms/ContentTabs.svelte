<!--
	Splits one top-level website section into accessible tabs (see editor-panels.ts)
	and renders the active tab's fields. `active` is bindable so the parent can
	remember the last tab per section.
-->
<script lang="ts">
	import ContentField from './ContentField.svelte';
	import { editorPanels } from './editor-panels';
	import { isQuestionField, type Content, type Field } from '$lib/content/schema';
	import { help } from './styles';
	let {
		field,
		value = $bindable(),
		path,
		active = $bindable(),
		disabled = false,
		onUploadChange
	}: {
		field: Field;
		value: Content;
		path: string;
		active?: string;
		disabled?: boolean;
		onUploadChange?: (active: boolean) => void;
	} = $props();
	const panels = $derived(editorPanels(path, field));
	const contentPanels = $derived(panels.filter((panel) => panel.group !== 'settings'));
	const settingsPanels = $derived(panels.filter((panel) => panel.group === 'settings'));
	const tab =
		'min-h-11 shrink-0 rounded-[6px] border border-line bg-white px-[14px] py-[10px] text-muted hover:border-cyan-ink aria-selected:border-cyan-ink aria-selected:bg-[#d7f2f1] aria-selected:text-ink';
	const selected = $derived(panels.find((panel) => panel.id === active) ?? panels[0]);

	/** Object holding the field at `keys`, so the last key can be bound directly. */
	function parentAt(keys: string[]): Content {
		return keys.slice(0, -1).reduce((parent, key) => parent[key], value);
	}
	/** WAI-ARIA tabs keyboard pattern: arrows cycle, Home/End jump, scoped to one tablist. */
	function navigateTabs(event: KeyboardEvent, list: typeof panels, index: number) {
		let next: number;
		if (event.key === 'ArrowRight') next = (index + 1) % list.length;
		else if (event.key === 'ArrowLeft') next = (index - 1 + list.length) % list.length;
		else if (event.key === 'Home') next = 0;
		else if (event.key === 'End') next = list.length - 1;
		else return;
		event.preventDefault();
		active = list[next].id;
		document.getElementById(`tab-${active}`)?.focus();
	}
</script>

<div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
	<h2 class="mb-[6px]">{field.label}</h2>
	{#if settingsPanels.length}
		<div
			class="m-0 flex flex-wrap gap-[6px] pb-0 [border-bottom:0] bp-760:flex-nowrap bp-760:overflow-x-auto bp-760:px-1 bp-760:pt-1 bp-760:pb-3"
			role="tablist"
			aria-label={`${field.label} page settings`}
		>
			{#each settingsPanels as panel, index (panel.id)}
				<button
					class={tab}
					type="button"
					role="tab"
					id={`tab-${panel.id}`}
					aria-selected={selected.id === panel.id}
					aria-controls={`panel-${path}`}
					tabindex={selected.id === panel.id ? 0 : -1}
					{disabled}
					onclick={() => (active = panel.id)}
					onkeydown={(event) => navigateTabs(event, settingsPanels, index)}>{panel.label}</button
				>
			{/each}
		</div>
	{/if}
</div>
<p class={help}>Choose a section to edit.</p>
{#if contentPanels.length > 1}
	<div
		class="mt-[22px] mb-[26px] flex flex-wrap gap-[6px] border-b border-b-line pb-4 bp-760:flex-nowrap bp-760:overflow-x-auto bp-760:px-1 bp-760:pt-1 bp-760:pb-3"
		role="tablist"
		aria-label={`${field.label} sections`}
	>
		{#each contentPanels as panel, index (panel.id)}
			<button
				class={tab}
				type="button"
				role="tab"
				id={`tab-${panel.id}`}
				aria-selected={selected.id === panel.id}
				aria-controls={`panel-${path}`}
				tabindex={selected.id === panel.id ? 0 : -1}
				{disabled}
				onclick={() => (active = panel.id)}
				onkeydown={(event) => navigateTabs(event, contentPanels, index)}>{panel.label}</button
			>
		{/each}
	</div>
{/if}
{#snippet panelFields()}
	{#each selected.fields as entry (entry.path.join('.'))}
		{#if entry.path.length}
			{@const parent = parentAt(entry.path)}
			<ContentField
				field={entry.field}
				bind:value={parent[entry.path[entry.path.length - 1]]}
				path={`${path}-${entry.path.join('-')}`}
				collapsible={isQuestionField(entry.field)}
				{disabled}
				{onUploadChange}
			/>
		{:else}
			<ContentField {field} bind:value {path} {disabled} {onUploadChange} />
		{/if}
	{/each}
{/snippet}

{#if panels.length > 1}
	<div
		class="mb-6 min-w-0"
		id={`panel-${path}`}
		role="tabpanel"
		aria-labelledby={`tab-${selected.id}`}
		tabindex="0"
	>
		{@render panelFields()}
	</div>
{:else}
	<div class="mb-6 min-w-0">{@render panelFields()}</div>
{/if}

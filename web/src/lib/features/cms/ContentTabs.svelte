<!--
	Splits one top-level website section into accessible tabs (see editor-panels.ts)
	and renders the active tab's fields. `active` is bindable so the parent can
	remember the last tab per section.
-->
<script lang="ts">
	import ContentField from './ContentField.svelte';
	import { editorPanels } from './editor-panels';
	import { isQuestionField, type Content, type Field } from '$lib/content/schema';
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
	const selected = $derived(panels.find((panel) => panel.id === active) ?? panels[0]);

	/** Object holding the field at `keys`, so the last key can be bound directly. */
	function parentAt(keys: string[]): Content {
		return keys.slice(0, -1).reduce((parent, key) => parent[key], value);
	}
	/** WAI-ARIA tabs keyboard pattern: arrows cycle, Home/End jump. */
	function navigateTabs(event: KeyboardEvent, index: number) {
		let next: number;
		if (event.key === 'ArrowRight') next = (index + 1) % panels.length;
		else if (event.key === 'ArrowLeft') next = (index - 1 + panels.length) % panels.length;
		else if (event.key === 'Home') next = 0;
		else if (event.key === 'End') next = panels.length - 1;
		else return;
		event.preventDefault();
		active = panels[next].id;
		document.getElementById(`tab-${active}`)?.focus();
	}
</script>

<div class="editor-panel-heading">
	<h2>{field.label}</h2>
	<p class="editor-help">Choose a section to edit. Save draft keeps changes from every section.</p>
</div>
{#if panels.length > 1}
	<div class="editor-tabs" role="tablist" aria-label={`${field.label} sections`}>
		{#each panels as panel, index (panel.id)}
			{#if panel.group === 'settings' && panels[index - 1]?.group !== 'settings'}
				<span class="editor-tabs-divider" aria-hidden="true">Page settings</span>
			{/if}
			<button
				type="button"
				role="tab"
				id={`tab-${panel.id}`}
				class:editor-tab-settings={panel.group === 'settings'}
				aria-selected={selected.id === panel.id}
				aria-controls={`panel-${path}`}
				tabindex={selected.id === panel.id ? 0 : -1}
				{disabled}
				onclick={() => (active = panel.id)}
				onkeydown={(event) => navigateTabs(event, index)}>{panel.label}</button
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
		class="editor-tab-content"
		id={`panel-${path}`}
		role="tabpanel"
		aria-labelledby={`tab-${selected.id}`}
		tabindex="0"
	>
		{@render panelFields()}
	</div>
{:else}
	<div class="editor-tab-content">{@render panelFields()}</div>
{/if}

<script lang="ts">
	import CollectionEditor from './CollectionEditor.svelte';
	import { untrack } from 'svelte';
	import { beforeNavigate } from '$app/navigation';
	type Row = Record<string, unknown> & { id: string };
	type Field = {
		name: string;
		label: string;
		type?: 'text' | 'textarea' | 'number' | 'checkbox' | 'image';
	};
	let { collection, rows, fields }: { collection: string; rows: Row[]; fields: Field[] } = $props();
	let items = $state<Row[]>(untrack(() => structuredClone(rows)));
	let newItemOpen = $state(false);
	let dirtyItems = $state<Record<string, boolean>>({});
	const dirty = $derived(Object.values(dirtyItems).some(Boolean));
	beforeNavigate(({ cancel, willUnload }) => {
		if (dirty && !willUnload && !window.confirm('You have unsaved changes. Leave without saving?'))
			cancel();
	});
	function saved(row: Row) {
		items = items.some((item) => item.id === row.id)
			? items.map((item) => (item.id === row.id ? row : item))
			: [...items, row];
	}
	function deleted(id: string) {
		delete dirtyItems[id];
		items = items.filter((item) => item.id !== id);
	}
</script>

<svelte:window
	onbeforeunload={(event) => {
		if (dirty) {
			event.preventDefault();
			event.returnValue = '';
		}
	}}
/>

<p class="editor-help">
	Only publish client stories and photos after receiving permission. Uploaded photos can be
	described for accessibility and search.
</p>
{#if dirty}<p class="editor-help" role="status">
		You have unsaved changes or an operation in progress.
	</p>{/if}
<div class="collection-grid">
	<details class="collection-add" bind:open={newItemOpen}>
		<summary class="cms-secondary">{newItemOpen ? 'Hide new item' : '+ Add new item'}</summary>
		<CollectionEditor
			{collection}
			{fields}
			onSaved={saved}
			onDeleted={deleted}
			onDirtyChange={(dirty) => (dirtyItems.new = dirty)}
		/>
	</details>
	{#each items as row (row.id)}<CollectionEditor
			{collection}
			{fields}
			{row}
			onSaved={saved}
			onDeleted={deleted}
			onDirtyChange={(dirty) => (dirtyItems[row.id] = dirty)}
		/>{/each}
</div>

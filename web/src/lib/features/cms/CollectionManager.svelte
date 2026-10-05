<script lang="ts">
	import CollectionEditor from './CollectionEditor.svelte';
	import ConfirmDialog from './ConfirmDialog.svelte';
	import { untrack } from 'svelte';
	import { beforeNavigate, goto } from '$app/navigation';
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
	let leaveTarget = $state<string | null>(null);
	let allowLeave = false;
	const dirty = $derived(Object.values(dirtyItems).some(Boolean));
	beforeNavigate(({ cancel, to, willUnload }) => {
		if (dirty && !willUnload && !allowLeave && to?.url) {
			cancel();
			leaveTarget = to.url.href;
		}
	});
	async function leave() {
		const target = leaveTarget;
		leaveTarget = null;
		if (!target) return;
		allowLeave = true;
		try {
			// This URL came from SvelteKit's own beforeNavigate event.
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			await goto(target);
		} finally {
			allowLeave = false;
		}
	}
	function cancelLeave() {
		leaveTarget = null;
		if (dirtyItems.new) newItemOpen = true;
	}
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
<ConfirmDialog
	open={leaveTarget !== null}
	title="Leave this page?"
	message="You have unsaved changes. Leaving now will discard them."
	confirmLabel="Leave page"
	danger
	onCancel={cancelLeave}
	onConfirm={() => void leave()}
/>

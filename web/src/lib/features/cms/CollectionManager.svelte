<!--
	Admin page body for an item collection: an "add new" form plus one editor
	per existing row. Guards navigation while any editor has unsaved changes.
-->
<script lang="ts">
	import CollectionEditor from './CollectionEditor.svelte';
	import ConfirmDialog from './ConfirmDialog.svelte';
	import { useLeaveGuard } from './leave-guard.svelte';
	import { untrack } from 'svelte';
	import { help, secondary } from './styles';
	import type { CollectionName, CollectionRow } from '$lib/content/collections';

	let { collection, rows }: { collection: CollectionName; rows: CollectionRow[] } = $props();
	let items = $state<CollectionRow[]>(untrack(() => structuredClone(rows)));
	let newItemOpen = $state(false);
	/** Dirty state per editor, keyed by row id (`new` for the add form). */
	let dirtyItems = $state<Record<string, boolean>>({});
	const dirty = $derived(Object.values(dirtyItems).some(Boolean));
	const guard = useLeaveGuard(() => dirty);

	function cancelLeave() {
		guard.cancel();
		// Reopen the add form so its unsaved draft stays visible.
		if (dirtyItems.new) newItemOpen = true;
	}
	function saved(row: CollectionRow) {
		items = items.some((item) => item.id === row.id)
			? items.map((item) => (item.id === row.id ? row : item))
			: [...items, row];
	}
	function deleted(id: string) {
		delete dirtyItems[id];
		items = items.filter((item) => item.id !== id);
	}
</script>

<p class={help}>
	Publish client stories and photos only with permission. Add photo descriptions for accessibility
	and search.
</p>
{#if dirty}<p class={help} role="status">
		You have unsaved changes or an operation in progress.
	</p>{/if}
<div class="grid gap-6">
	<details bind:open={newItemOpen}>
		<summary class="{secondary} [[open]>&]:mb-4"
			>{newItemOpen ? 'Hide new item' : '+ Add new item'}</summary
		>
		<CollectionEditor
			{collection}
			onSaved={saved}
			onDeleted={deleted}
			onDirtyChange={(dirty) => (dirtyItems.new = dirty)}
		/>
	</details>
	{#each items as row (row.id)}<CollectionEditor
			{collection}
			{row}
			onSaved={saved}
			onDeleted={deleted}
			onDirtyChange={(dirty) => (dirtyItems[row.id] = dirty)}
		/>{/each}
</div>
<ConfirmDialog
	open={guard.pending}
	title="Leave this page?"
	message="You have unsaved changes. Leaving now will discard them."
	confirmLabel="Leave page"
	danger
	onCancel={cancelLeave}
	onConfirm={() => void guard.leave()}
/>

<!--
	Admin page body for an item collection: an "add new" form plus a list of
	items. Each row has its own actions: show or hide on the website, edit
	(opens the form below the row) and delete. Rows are reordered by dragging
	the handle, or by focusing it and pressing the up and down arrow keys; each
	new order is saved straight away and rolled back if the save fails.
	Guards navigation while any editor has unsaved changes.
-->
<script lang="ts">
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import ImageOff from '@lucide/svelte/icons/image-off';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash';
	import X from '@lucide/svelte/icons/x';
	import CollectionEditor from './CollectionEditor.svelte';
	import ConfirmDialog from './ConfirmDialog.svelte';
	import { cmsRequest, errorMessage } from './api';
	import { useLeaveGuard } from './leave-guard.svelte';
	import { moveItem, numberedInOrder } from './reorder';
	import { tick, untrack } from 'svelte';
	import { badgeWarn, help, secondary, subtle, subtleDanger } from './styles';
	import {
		collections,
		MAX_SORT_ORDER,
		type CollectionDefinition,
		type CollectionName,
		type CollectionRow
	} from '$lib/content/collections';

	let { collection, rows }: { collection: CollectionName; rows: CollectionRow[] } = $props();
	const { titleField, detailField, imageField, itemLabel, fields }: CollectionDefinition = untrack(
		() => collections[collection]
	);
	const requiredFields = fields.filter((field) => field.required).map((field) => field.name);
	const endpoint = untrack(() => `/api/cms/${collection}`);
	let items = $state<CollectionRow[]>(untrack(() => structuredClone(rows)));
	let newItemOpen = $state(false);
	/** Items whose editor is open, keyed by row id. */
	let expanded = $state<Record<string, boolean>>({});
	/** Dirty state per editor, keyed by row id (`new` for the add form). */
	let dirtyItems = $state<Record<string, boolean>>({});
	/** Rows with a publish or delete request in flight. */
	let busyItems = $state<Record<string, boolean>>({});
	let orderSaving = $state(false);
	let status = $state('');
	let dragId = $state<string | null>(null);
	let overId = $state<string | null>(null);
	let pendingDelete = $state<CollectionRow | null>(null);
	let list = $state<HTMLOListElement>();
	/** Order the server last confirmed, restored if saving a new order fails. */
	let confirmedOrder = untrack(() => rows.map((row) => row.id));
	let orderQueued = false;
	let moveNote = '';
	const dirty = $derived(
		orderSaving || Object.values(dirtyItems).some(Boolean) || Object.values(busyItems).some(Boolean)
	);
	/** Position for a new item: after every existing one. */
	const nextSortOrder = $derived(
		Math.min(
			MAX_SORT_ORDER,
			items.reduce((last, item) => Math.max(last, Number(item.sort_order) || 0), -1) + 1
		)
	);
	const guard = useLeaveGuard(() => dirty);
	const text = (row: CollectionRow, field?: string) => (field ? String(row[field] ?? '') : '');

	function cancelLeave() {
		guard.cancel();
		// Reopen the add form so its unsaved draft stays visible.
		if (dirtyItems.new) newItemOpen = true;
	}
	/** Replaces a known row, keeping its list position (a newer drag may postdate the save). */
	function replace(row: CollectionRow) {
		items = items.map((item) =>
			item.id === row.id ? { ...row, sort_order: item.sort_order } : item
		);
	}
	function saved(row: CollectionRow) {
		if (items.some((item) => item.id === row.id)) replace(row);
		else {
			items = [...items, row];
			confirmedOrder = [...confirmedOrder, row.id];
			newItemOpen = false;
			status = `${text(row, titleField)} added.`;
		}
	}

	async function togglePublished(row: CollectionRow) {
		const next = !row.is_published;
		busyItems[row.id] = true;
		replace({ ...row, is_published: next });
		try {
			const required = Object.fromEntries(requiredFields.map((name) => [name, row[name]]));
			const savedRow = await cmsRequest<CollectionRow>(
				endpoint,
				{ method: 'PATCH', json: { id: row.id, ...required, is_published: next } },
				'The change could not be saved.'
			);
			replace(savedRow);
			status = `${text(row, titleField)} is ${next ? 'now on' : 'hidden from'} the website.`;
		} catch (error) {
			replace({ ...row, is_published: !next });
			status = errorMessage(error, 'The change could not be saved.');
		} finally {
			delete busyItems[row.id];
		}
	}

	async function remove(row: CollectionRow) {
		busyItems[row.id] = true;
		try {
			await cmsRequest(
				`${endpoint}?id=${encodeURIComponent(row.id)}`,
				{ method: 'DELETE' },
				'Delete failed.'
			);
			delete dirtyItems[row.id];
			delete expanded[row.id];
			items = items.filter((item) => item.id !== row.id);
			confirmedOrder = confirmedOrder.filter((known) => known !== row.id);
			status = `${text(row, titleField)} deleted.`;
		} catch (error) {
			status = errorMessage(error, 'Delete failed. Please try again.');
		} finally {
			delete busyItems[row.id];
		}
	}

	function reorder(from: number, to: number) {
		if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return;
		const ids = moveItem(
			items.map((item) => item.id),
			from,
			to
		);
		moveNote = `${text(items[from], titleField)} moved to position ${to + 1} of ${items.length}.`;
		items = numberedInOrder(items, ids);
		void saveOrder();
	}
	/** Saves the current order; moves made meanwhile are sent in a follow-up request. */
	async function saveOrder() {
		if (orderSaving) {
			orderQueued = true;
			return;
		}
		orderSaving = true;
		status = 'Saving the new order…';
		try {
			do {
				orderQueued = false;
				const order = items.map((item) => item.id);
				await cmsRequest(
					endpoint,
					{ method: 'PUT', json: { order } },
					'The new order could not be saved.'
				);
				confirmedOrder = order;
			} while (orderQueued);
			status = `${moveNote} Order updated.`;
		} catch (error) {
			items = numberedInOrder(items, confirmedOrder);
			status = errorMessage(error, 'The new order could not be saved.');
		} finally {
			orderSaving = false;
		}
	}
	/** Arrow keys on a focused handle move its row one place; focus stays on the handle. */
	async function handleKey(event: KeyboardEvent, id: string) {
		const direction = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
		if (!direction) return;
		event.preventDefault();
		const index = items.findIndex((item) => item.id === id);
		reorder(index, index + direction);
		await tick();
		list?.querySelector<HTMLButtonElement>(`[data-handle="${id}"]`)?.focus();
	}

	function dragStart(event: DragEvent, id: string) {
		dragId = id;
		if (!event.dataTransfer) return;
		event.dataTransfer.setData('text/plain', id);
		event.dataTransfer.effectAllowed = 'move';
		const header = (event.currentTarget as HTMLElement).parentElement;
		if (header) event.dataTransfer.setDragImage(header, 16, 16);
	}
	function dragOver(event: DragEvent, id: string) {
		if (dragId === null) return;
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
		overId = id;
	}
	function drop(event: DragEvent, id: string) {
		event.preventDefault();
		if (dragId !== null)
			reorder(
				items.findIndex((item) => item.id === dragId),
				items.findIndex((item) => item.id === id)
			);
		dragEnd();
	}
	function dragEnd() {
		dragId = null;
		overId = null;
	}
</script>

{#if dirty}<p class={help} role="status">
		You have unsaved changes or an operation in progress.
	</p>{/if}
<p class={help} aria-live="polite">{status}</p>
<div class="grid gap-6">
	<details bind:open={newItemOpen}>
		<summary class="{secondary} [[open]>&]:mb-4"
			>{#if newItemOpen}<X size={18} aria-hidden="true" />Cancel{:else}<Plus
					size={18}
					aria-hidden="true"
				/>Add {itemLabel}{/if}</summary
		>
		<CollectionEditor
			{collection}
			sortOrder={nextSortOrder}
			onSaved={saved}
			onDirtyChange={(dirty) => (dirtyItems.new = dirty)}
		/>
	</details>
	{#if items.length === 0}
		<p class="rounded-[10px] border border-dashed border-line p-6 text-center text-muted">
			No {itemLabel}s yet.
		</p>
	{/if}
	<ol bind:this={list} class="m-0 grid list-none gap-3 p-0">
		{#each items as row (row.id)}
			{@const open = !!expanded[row.id]}
			{@const title = text(row, titleField)}
			{@const detail = text(row, detailField)}
			{@const image = text(row, imageField)}
			{@const busy = !!busyItems[row.id]}
			{@const live = !!row.is_published}
			<li
				class={[
					'min-w-0 overflow-hidden rounded-[10px] border bg-paper',
					dragId === row.id && 'opacity-50',
					overId === row.id && dragId !== row.id
						? 'border-cyan-ink [box-shadow:0_0_0_1px_#157f90]'
						: 'border-line'
				]}
				ondragover={(event) => dragOver(event, row.id)}
				ondrop={(event) => drop(event, row.id)}
			>
				<div class="flex flex-wrap items-center gap-2 p-2">
					{#if items.length > 1}<button
							type="button"
							class="min-h-11 cursor-grab touch-none rounded-[6px] border-0 bg-transparent px-2 text-[1.25rem] leading-none text-[#99a9ab] hover:text-ink"
							title="Drag to reorder"
							aria-label={`Reorder ${title}. Use the up and down arrow keys.`}
							data-handle={row.id}
							draggable="true"
							ondragstart={(event) => dragStart(event, row.id)}
							ondragend={dragEnd}
							onkeydown={(event) => handleKey(event, row.id)}
							><GripVertical size={20} aria-hidden="true" /></button
						>{/if}
					{#if image}<img
							class="h-11 w-11 shrink-0 rounded-[6px] object-cover"
							src={image}
							alt=""
							loading="lazy"
						/>{:else}<span
							class="grid h-11 w-11 shrink-0 place-items-center rounded-[6px] border border-dashed border-current text-muted"
							title="No photo"
							aria-hidden="true"><ImageOff size={18} /></span
						>{/if}
					<span class="grid min-w-0 flex-1 basis-40 grid-cols-[minmax(0,1fr)]">
						<span class="flex flex-wrap items-center gap-x-2 gap-y-1">
							<strong class="min-w-0 truncate text-[0.95rem]">{title}</strong>
							{#if dirtyItems[row.id]}<span class={badgeWarn}>Unsaved</span>{/if}
						</span>
						{#if detail}<span class="truncate text-[0.8rem] font-normal text-muted">{detail}</span
							>{/if}
					</span>
					<span class="ml-auto flex flex-wrap items-center gap-1">
						<button
							type="button"
							role="switch"
							aria-checked={live}
							aria-label={`Show ${title} on the website`}
							class="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-[6px] border-0 bg-transparent px-2 text-[0.8rem] font-semibold"
							disabled={busy}
							onclick={() => togglePublished(row)}
						>
							<span
								class={[
									'relative h-6 w-10 shrink-0 rounded-full transition-colors',
									live ? 'bg-[#1f8a6f]' : 'bg-[#b7c6c7]'
								]}
								aria-hidden="true"
								><span
									class={[
										'absolute top-[3px] left-[3px] h-[18px] w-[18px] rounded-full bg-white transition-transform',
										live && 'translate-x-4'
									]}
								></span></span
							>
							<span class={['w-14 text-left', live ? 'text-[#175e4d]' : 'text-muted']}
								>{live ? 'Live' : 'Hidden'}</span
							>
						</button>
						<button
							type="button"
							class={subtle}
							aria-expanded={open}
							aria-controls="{row.id}-editor"
							aria-label={`${open ? 'Close' : 'Edit'} ${title}`}
							onclick={() => (expanded[row.id] = !open)}
							>{#if open}<X size={16} aria-hidden="true" />Close{:else}<Pencil
									size={16}
									aria-hidden="true"
								/>Edit{/if}</button
						>
						<button
							type="button"
							class={subtleDanger}
							aria-label={`Delete ${title}`}
							disabled={busy}
							onclick={() => (pendingDelete = row)}
							><Trash2 size={16} aria-hidden="true" />Delete</button
						>
					</span>
				</div>
				<!-- Hidden, not removed: unsaved edits survive while the item is collapsed. -->
				<div id="{row.id}-editor" hidden={!open}>
					<CollectionEditor
						embedded
						{collection}
						{row}
						onSaved={saved}
						onDirtyChange={(dirty) => (dirtyItems[row.id] = dirty)}
					/>
				</div>
			</li>
		{/each}
	</ol>
</div>
<ConfirmDialog
	open={pendingDelete !== null}
	title={`Delete ${itemLabel}?`}
	message={`"${pendingDelete ? text(pendingDelete, titleField) : ''}" will be removed from the website. This cannot be undone.`}
	confirmLabel="Delete"
	cancelLabel="Cancel"
	danger
	onCancel={() => (pendingDelete = null)}
	onConfirm={() => {
		const row = pendingDelete;
		pendingDelete = null;
		if (row) void remove(row);
	}}
/>
<ConfirmDialog
	open={guard.pending}
	title="Leave this page?"
	message="You have unsaved changes. Leaving now will discard them."
	confirmLabel="Leave page"
	danger
	onCancel={cancelLeave}
	onConfirm={() => void guard.leave()}
/>

<!--
	Admin page body for an item collection: an "add new" form plus a list of
	collapsible items. Items are reordered by dragging the handle or with the
	arrow buttons; each new order is saved straight away and rolled back if the
	save fails. Guards navigation while any editor has unsaved changes.
-->
<script lang="ts">
	import CollectionEditor from './CollectionEditor.svelte';
	import ConfirmDialog from './ConfirmDialog.svelte';
	import { cmsRequest, errorMessage } from './api';
	import { useLeaveGuard } from './leave-guard.svelte';
	import { moveItem, numberedInOrder } from './reorder';
	import { tick, untrack } from 'svelte';
	import { badgeNeutral, badgeOk, badgeWarn, help, secondary, secondaryCompact } from './styles';
	import {
		collections,
		MAX_SORT_ORDER,
		type CollectionDefinition,
		type CollectionName,
		type CollectionRow
	} from '$lib/content/collections';

	let { collection, rows }: { collection: CollectionName; rows: CollectionRow[] } = $props();
	const { titleField, detailField, imageField }: CollectionDefinition = untrack(
		() => collections[collection]
	);
	const endpoint = untrack(() => `/api/cms/${collection}`);
	let items = $state<CollectionRow[]>(untrack(() => structuredClone(rows)));
	let newItemOpen = $state(false);
	/** Items whose editor is open, keyed by row id. */
	let expanded = $state<Record<string, boolean>>({});
	/** Dirty state per editor, keyed by row id (`new` for the add form). */
	let dirtyItems = $state<Record<string, boolean>>({});
	let orderSaving = $state(false);
	let orderMessage = $state('');
	let dragId = $state<string | null>(null);
	let overId = $state<string | null>(null);
	let list = $state<HTMLOListElement>();
	/** Order the server last confirmed, restored if saving a new order fails. */
	let confirmedOrder = untrack(() => rows.map((row) => row.id));
	let orderQueued = false;
	let moveNote = '';
	const dirty = $derived(orderSaving || Object.values(dirtyItems).some(Boolean));
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
	function saved(row: CollectionRow) {
		const known = items.find((item) => item.id === row.id);
		if (known) {
			// Position belongs to the list; the saved row may predate a newer drag.
			items = items.map((item) =>
				item.id === row.id ? { ...row, sort_order: known.sort_order } : item
			);
		} else {
			items = [...items, row];
			confirmedOrder = [...confirmedOrder, row.id];
		}
	}
	function deleted(id: string) {
		delete dirtyItems[id];
		items = items.filter((item) => item.id !== id);
		confirmedOrder = confirmedOrder.filter((known) => known !== id);
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
		orderMessage = 'Saving the new order…';
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
			orderMessage = `${moveNote} Order updated.`;
		} catch (error) {
			items = numberedInOrder(items, confirmedOrder);
			orderMessage = errorMessage(error, 'The new order could not be saved.');
		} finally {
			orderSaving = false;
		}
	}
	/** Moves an item one place and keeps keyboard focus on its arrow buttons. */
	async function step(id: string, direction: -1 | 1) {
		const index = items.findIndex((item) => item.id === id);
		reorder(index, index + direction);
		await tick();
		const arrows = [...(list?.querySelectorAll<HTMLButtonElement>(`[data-arrows="${id}"]`) ?? [])];
		(
			arrows.find((arrow) => !arrow.disabled && Number(arrow.dataset.step) === direction) ??
			arrows.find((arrow) => !arrow.disabled)
		)?.focus();
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

<p class={help}>
	Publish client stories and photos only with permission. Add photo descriptions for accessibility
	and search.
</p>
{#if items.length > 1}<p class={help}>
		Open an entry to edit it. Drag the ⠿ handle, or use the arrows, to change the order: the website
		shows entries from the top of this list down.
	</p>{/if}
{#if dirty}<p class={help} role="status">
		You have unsaved changes or an operation in progress.
	</p>{/if}
<p class={help} aria-live="polite">{orderMessage}</p>
<div class="grid gap-6">
	<details bind:open={newItemOpen}>
		<summary class="{secondary} [[open]>&]:mb-4"
			>{newItemOpen ? 'Hide new item' : '+ Add new item'}</summary
		>
		<CollectionEditor
			{collection}
			sortOrder={nextSortOrder}
			onSaved={saved}
			onDeleted={deleted}
			onDirtyChange={(dirty) => (dirtyItems.new = dirty)}
		/>
	</details>
	<ol bind:this={list} class="m-0 grid list-none gap-3 p-0">
		{#each items as row, index (row.id)}
			{@const open = !!expanded[row.id]}
			{@const title = text(row, titleField)}
			{@const detail = text(row, detailField)}
			{@const image = text(row, imageField)}
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
				<div class="flex items-center gap-2 p-2">
					<span
						class="cursor-grab touch-none px-2 text-[1.25rem] leading-none text-[#99a9ab]"
						aria-hidden="true"
						draggable="true"
						ondragstart={(event) => dragStart(event, row.id)}
						ondragend={dragEnd}>⠿</span
					>
					<span class="min-w-6 text-[0.8rem] text-muted">{index + 1}</span>
					<button
						type="button"
						class="flex min-w-0 flex-1 items-center gap-3 rounded-[6px] border-0 bg-transparent p-1 text-left text-ink"
						aria-expanded={open}
						aria-controls="{row.id}-editor"
						onclick={() => (expanded[row.id] = !open)}
					>
						{#if image}<img
								class="h-10 w-10 shrink-0 rounded-[6px] object-cover"
								src={image}
								alt=""
								loading="lazy"
							/>{/if}
						<span class="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)]">
							<span class="flex flex-wrap items-center gap-x-3 gap-y-1">
								<strong class="min-w-0 truncate text-[0.95rem]">{title}</strong>
								<span class={row.is_published ? badgeOk : badgeNeutral}
									>{row.is_published ? 'Published' : 'Not published'}</span
								>
								{#if dirtyItems[row.id]}<span class={badgeWarn}>Unsaved</span>{/if}
							</span>
							{#if detail}<span class="truncate text-[0.8rem] font-normal text-muted">{detail}</span
								>{/if}
						</span>
						<span
							class={['inline-block text-[1.1rem] transition-transform', open && 'rotate-180']}
							aria-hidden="true">▾</span
						>
					</button>
					<button
						type="button"
						class={secondaryCompact}
						aria-label={`Move ${title} up`}
						data-arrows={row.id}
						data-step="-1"
						disabled={index === 0}
						onclick={() => step(row.id, -1)}>↑</button
					>
					<button
						type="button"
						class={secondaryCompact}
						aria-label={`Move ${title} down`}
						data-arrows={row.id}
						data-step="1"
						disabled={index === items.length - 1}
						onclick={() => step(row.id, 1)}>↓</button
					>
				</div>
				<!-- Hidden, not removed: unsaved edits survive while the item is collapsed. -->
				<div id="{row.id}-editor" hidden={!open}>
					<CollectionEditor
						embedded
						{collection}
						{row}
						onSaved={saved}
						onDeleted={deleted}
						onDirtyChange={(dirty) => (dirtyItems[row.id] = dirty)}
					/>
				</div>
			</li>
		{/each}
	</ol>
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

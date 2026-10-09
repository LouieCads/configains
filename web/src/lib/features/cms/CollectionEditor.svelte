<!--
	Form for one collection item. Without `row` it creates a new item and
	resets after saving; with `row` it updates or deletes that item.
	Reports unsaved edits and in-flight work through `onDirtyChange`.
-->
<script lang="ts">
	import ContentField from './ContentField.svelte';
	import ConfirmDialog from './ConfirmDialog.svelte';
	import { cmsRequest, errorMessage } from './api';
	import { card, primary, secondaryDanger } from './styles';
	import { onDestroy, untrack } from 'svelte';
	import {
		collections,
		emptyValues,
		MAX_SORT_ORDER,
		type CollectionName,
		type CollectionRow
	} from '$lib/content/collections';
	import type { Content } from '$lib/content/schema';

	let {
		collection,
		row,
		onSaved,
		onDeleted,
		onDirtyChange
	}: {
		collection: CollectionName;
		row?: CollectionRow;
		onSaved: (row: CollectionRow) => void;
		onDeleted: (id: string) => void;
		onDirtyChange: (dirty: boolean) => void;
	} = $props();

	const { fields, itemLabel } = untrack(() => collections[collection]);
	const endpoint = untrack(() => `/api/cms/${collection}`);
	let values = $state<Content>(
		untrack(() => {
			const blank = emptyValues(fields);
			return Object.fromEntries(fields.map(({ name }) => [name, row?.[name] ?? blank[name]]));
		})
	);
	let busy = $state(false),
		pendingUploads = $state(0),
		message = $state(''),
		deleteOpen = $state(false);
	let baseline = $state(untrack(() => JSON.stringify(values)));
	const locked = $derived(busy || pendingUploads > 0);

	$effect(() => {
		onDirtyChange(JSON.stringify(values) !== baseline || locked);
	});
	onDestroy(() => onDirtyChange(false));

	async function save(event: SubmitEvent) {
		event.preventDefault();
		busy = true;
		message = '';
		try {
			const saved = await cmsRequest<CollectionRow>(
				endpoint,
				{ method: row ? 'PATCH' : 'POST', json: row ? { id: row.id, ...values } : values },
				'The change could not be saved.'
			);
			onSaved(saved);
			message = 'Saved.';
			if (!row) values = emptyValues(fields);
			baseline = JSON.stringify(values);
		} catch (error) {
			message = errorMessage(error, 'Saving failed. Please try again.');
		} finally {
			busy = false;
		}
	}

	async function remove() {
		if (!row) return;
		busy = true;
		message = '';
		try {
			await cmsRequest(
				`${endpoint}?id=${encodeURIComponent(row.id)}`,
				{ method: 'DELETE' },
				'Delete failed.'
			);
			onDeleted(row.id);
		} catch (error) {
			message = errorMessage(error, 'Delete failed. Please try again.');
		} finally {
			busy = false;
		}
	}
</script>

<form class="{card} grid gap-4" onsubmit={save}>
	{#each fields as field (field.name)}
		{#if field.type === 'image'}<ContentField
				field={{ label: field.label, kind: 'image' }}
				bind:value={values[field.name]}
				path={(row?.id || 'new') + '-' + field.name}
				bucket={collection}
				inCollection
				disabled={busy}
				onUploadChange={(uploading) => {
					pendingUploads = Math.max(0, pendingUploads + (uploading ? 1 : -1));
				}}
			/>
		{:else}<label class="grid gap-[6px] text-[0.875rem] font-semibold"
				>{field.label}
				{#if field.type === 'textarea'}<textarea
						bind:value={values[field.name]}
						rows="4"
						disabled={busy}></textarea>
				{:else if field.type === 'checkbox'}<input
						type="checkbox"
						bind:checked={values[field.name]}
						disabled={busy}
					/>
				{:else if field.type === 'number'}<input
						type="number"
						bind:value={values[field.name]}
						min="0"
						max={MAX_SORT_ORDER}
						step="1"
						disabled={busy}
					/>
				{:else}<input
						type="text"
						bind:value={values[field.name]}
						disabled={busy}
						required={field.required}
					/>{/if}
			</label>{/if}
	{/each}
	{#if message}<p role="status">{message}</p>{/if}
	<div class="flex flex-wrap gap-3">
		<button class={primary} disabled={locked}
			>{busy ? 'Saving…' : row ? 'Save item' : 'Create item'}</button
		>{#if row}<button
				type="button"
				class={secondaryDanger}
				disabled={locked}
				onclick={() => (deleteOpen = true)}>Delete item</button
			>{/if}
	</div>
</form>
<ConfirmDialog
	open={deleteOpen}
	title={`Delete ${itemLabel}?`}
	message="This item will be removed from the website. This action cannot be undone."
	confirmLabel="Delete item"
	danger
	onCancel={() => (deleteOpen = false)}
	onConfirm={() => {
		deleteOpen = false;
		void remove();
	}}
/>

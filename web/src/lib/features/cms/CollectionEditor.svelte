<script lang="ts">
	import ContentField from './ContentField.svelte';
	import { onDestroy, untrack } from 'svelte';
	import type { Content } from '$lib/content/schema';
	type Row = Record<string, unknown> & { id: string };
	type Field = {
		name: string;
		label: string;
		type?: 'text' | 'textarea' | 'number' | 'checkbox' | 'image';
	};
	let {
		collection,
		fields,
		row,
		onSaved,
		onDeleted,
		onDirtyChange
	}: {
		collection: string;
		fields: Field[];
		row?: Row;
		onSaved: (row: Row) => void;
		onDeleted: (id: string) => void;
		onDirtyChange: (dirty: boolean) => void;
	} = $props();
	let values = $state<Content>(
		untrack(() =>
			Object.fromEntries(
				fields.map((field) => [
					field.name,
					row?.[field.name] ??
						(field.type === 'checkbox' ? false : field.type === 'number' ? 0 : '')
				])
			)
		)
	);
	let busy = $state(false),
		pendingUploads = $state(0),
		message = $state('');
	let baseline = $state(untrack(() => JSON.stringify(values)));
	$effect(() => {
		onDirtyChange(JSON.stringify(values) !== baseline || busy || pendingUploads > 0);
	});
	onDestroy(() => onDirtyChange(false));
	async function save(event: SubmitEvent) {
		event.preventDefault();
		busy = true;
		message = '';
		try {
			const response = await fetch('/api/cms/' + collection, {
				method: row ? 'PATCH' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...(row ? { id: row.id } : {}), ...values })
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.message || 'The change could not be saved.');
			onSaved(result);
			message = 'Saved.';
			if (!row)
				values = Object.fromEntries(
					fields.map((field) => [
						field.name,
						field.type === 'checkbox' ? false : field.type === 'number' ? 0 : ''
					])
				);
			baseline = JSON.stringify(values);
		} catch (error) {
			message = error instanceof Error ? error.message : 'Saving failed. Please try again.';
		} finally {
			busy = false;
		}
	}
	async function remove() {
		if (!row || !window.confirm('Delete this item? This cannot be undone.')) return;
		busy = true;
		message = '';
		try {
			const response = await fetch('/api/cms/' + collection + '?id=' + encodeURIComponent(row.id), {
				method: 'DELETE'
			});
			if (!response.ok) {
				const result = await response.json();
				throw new Error(result.message || 'Delete failed.');
			}
			onDeleted(row.id);
		} catch (error) {
			message = error instanceof Error ? error.message : 'Delete failed. Please try again.';
		} finally {
			busy = false;
		}
	}
</script>

<form class="cms-card" onsubmit={save}>
	{#each fields as field (field.name)}
		{#if field.type === 'image'}<ContentField
				field={{ label: field.label, kind: 'image' }}
				bind:value={values[field.name]}
				path={(row?.id || 'new') + '-' + field.name}
				disabled={busy}
				onUploadChange={(uploading) => {
					pendingUploads = Math.max(0, pendingUploads + (uploading ? 1 : -1));
				}}
			/>
		{:else}<label
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
						max="10000"
						step="1"
						disabled={busy}
					/>
				{:else}<input
						type="text"
						bind:value={values[field.name]}
						disabled={busy}
						required={['title', 'name'].includes(field.name)}
					/>{/if}
			</label>{/if}
	{/each}
	{#if message}<p role="status">{message}</p>{/if}
	<div class="collection-actions">
		<button class="cms-primary" disabled={busy || pendingUploads > 0}
			>{busy ? 'Saving…' : row ? 'Save item' : 'Create item'}</button
		>{#if row}<button
				type="button"
				class="cms-secondary danger"
				disabled={busy || pendingUploads > 0}
				onclick={remove}>Delete item</button
			>{/if}
	</div>
</form>

<script lang="ts">
	type Row = Record<string, unknown> & { id: string };
	type Field = { name: string; label: string; type?: 'text' | 'textarea' | 'number' | 'checkbox' };

	let { collection, rows, fields }: { collection: string; rows: Row[]; fields: Field[] } = $props();
	let busy = $state(false);
	let message = $state('');

	function payload(form: HTMLFormElement) {
		const data = new FormData(form);
		const result: Record<string, unknown> = {};
		for (const field of fields) {
			if (field.type === 'checkbox') result[field.name] = data.get(field.name) === 'on';
			else if (field.type === 'number') result[field.name] = Number(data.get(field.name) || 0);
			else result[field.name] = String(data.get(field.name) ?? '');
		}
		return result;
	}

	async function submit(event: SubmitEvent, id?: string) {
		event.preventDefault();
		busy = true;
		message = '';
		const form = event.currentTarget as HTMLFormElement;
		const response = await fetch(`/api/cms/${collection}`, {
			method: id ? 'PATCH' : 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ ...(id ? { id } : {}), ...payload(form) })
		});
		if (response.ok) location.reload();
		else message = (await response.json()).message ?? 'The change could not be saved.';
		busy = false;
	}

	async function remove(id: string) {
		busy = true;
		const response = await fetch(`/api/cms/${collection}?id=${encodeURIComponent(id)}`, {
			method: 'DELETE'
		});
		if (response.ok) location.reload();
		else message = (await response.json()).message ?? 'The item could not be deleted.';
		busy = false;
	}
</script>

{#snippet controls(row?: Row)}
	{#each fields as field (field.name)}
		<label class="grid gap-1 text-sm font-bold text-slate-700">
			{field.label}
			{#if field.type === 'textarea'}
				<textarea name={field.name} rows="4" class="rounded-lg border-slate-300 font-normal"
					>{row?.[field.name] ?? ''}</textarea
				>
			{:else if field.type === 'checkbox'}
				<input
					name={field.name}
					type="checkbox"
					checked={Boolean(row?.[field.name])}
					class="rounded border-slate-300"
				/>
			{:else}
				<input
					name={field.name}
					type={field.type ?? 'text'}
					value={String(row?.[field.name] ?? '')}
					class="rounded-lg border-slate-300 font-normal"
				/>
			{/if}
		</label>
	{/each}
{/snippet}

{#if message}<p role="alert" class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
		{message}
	</p>{/if}

<details class="mb-8 rounded-2xl bg-white p-6 shadow-sm">
	<summary class="cursor-pointer font-black">Add new item</summary>
	<form class="mt-6 grid gap-4" onsubmit={(event) => submit(event)}>
		{@render controls()}
		<button
			disabled={busy}
			class="w-fit rounded-lg bg-emerald-700 px-5 py-2.5 font-bold text-white disabled:opacity-50"
			>Create item</button
		>
	</form>
</details>

<div class="grid gap-5">
	{#each rows as row (row.id)}
		<form
			class="grid gap-4 rounded-2xl bg-white p-6 shadow-sm"
			onsubmit={(event) => submit(event, row.id)}
		>
			{@render controls(row)}
			<div class="flex gap-3">
				<button
					disabled={busy}
					class="rounded-lg bg-[#172019] px-5 py-2.5 font-bold text-white disabled:opacity-50"
					>Save</button
				>
				<button
					type="button"
					disabled={busy}
					onclick={() => remove(row.id)}
					class="rounded-lg border border-red-200 px-5 py-2.5 font-bold text-red-700 disabled:opacity-50"
					>Delete</button
				>
			</div>
		</form>
	{/each}
</div>

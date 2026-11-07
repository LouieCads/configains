<script lang="ts">
	import { enhance } from '$app/forms';
	import { goals, templateKinds } from '$lib/coaching/template';
	import {
		badgeNeutral,
		card,
		error,
		flow,
		help,
		primary,
		secondary,
		subtle,
		success,
		tabIdle,
		tabSelected,
		requiredMark
	} from '$lib/features/cms/styles';
	let { data, form } = $props();

	type Template = (typeof data.templates)[number];
	const goalLabel = (value: string) => goals.find((goal) => goal.value === value)?.label ?? value;
	const kindLabel = (value: string) =>
		templateKinds.find((kind) => kind.value === value)?.label ?? value;
	const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });
	const updatedLabel = (value: string | null) => {
		const date = value ? new Date(value) : null;
		return date && !Number.isNaN(date.getTime()) ? dateFormat.format(date) : '';
	};
	const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;
	const usageOf = (template: Template) => (data.usage as Record<string, number>)[template.id] ?? 0;

	let kind = $state('all');
	let query = $state('');
	const filters = [{ value: 'all', label: 'All' }, ...templateKinds];

	const visible = $derived.by(() => {
		const text = query.trim().toLowerCase();
		return data.templates.filter(
			(template) =>
				(kind === 'all' || template.kind === kind) &&
				(!text ||
					template.name.toLowerCase().includes(text) ||
					goalLabel(template.goal).toLowerCase().includes(text))
		);
	});
	const active = $derived(visible.filter((template) => !template.is_archived));
	const archived = $derived(visible.filter((template) => template.is_archived));
	const countFor = (value: string) =>
		data.templates.filter(
			(template) => !template.is_archived && (value === 'all' || template.kind === value)
		).length;

	const nutritionTemplates = $derived(
		data.templates.filter((template) => template.kind === 'nutrition' && !template.is_archived)
	);

	// One dialog serves every row: it assigns whichever workout was picked.
	let dialog = $state<HTMLDialogElement>();
	let assigning = $state<Template | null>(null);
	let clientId = $state('');
	let nutritionChoice = $state('');
	let busy = $state(false);
	const chosenClient = $derived(data.clients.find((client) => client.id === clientId));
	function openAssign(template: Template) {
		assigning = template;
		clientId = '';
		nutritionChoice = '';
		dialog?.showModal();
	}

	const row =
		'relative flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[10px] border border-line bg-paper p-4 hover:border-cyan-ink focus-within:border-cyan-ink';
	const rowAction = `${subtle} relative z-10 hover:bg-[#eef3f3] hover:text-ink`;
</script>

<svelte:head><title>Templates | Configains CMS</title></svelte:head>

{#snippet templateRow(template: Template)}
	{@const used = usageOf(template)}
	<li class={row}>
		<span class="grid min-w-0 flex-1 basis-56">
			<span class="flex min-w-0 items-baseline gap-2">
				<a
					class="truncate font-bold text-ink no-underline after:absolute after:inset-0 after:content-['']"
					href="/admin/templates/{template.id}"
					aria-label="Edit {template.name}">{template.name}</a
				>
				{#if updatedLabel(template.updated_at)}
					<span class="shrink-0 text-[0.7rem] text-muted"
						><span class="sr-only">Updated </span>{updatedLabel(template.updated_at)}</span
					>
				{/if}
			</span>
			<span class="truncate text-[0.85rem] text-muted"
				>{goalLabel(template.goal)} · {plural(template.phaseCount, 'phase')}{used > 0
					? ` · ${plural(used, 'client')}`
					: ''}</span
			>
		</span>
		<span class={badgeNeutral}>{kindLabel(template.kind)}</span>
		<div class="flex flex-wrap items-center gap-1">
			{#if template.kind === 'workout' && !template.is_archived && data.clients.length > 0}
				<button
					type="button"
					class={rowAction}
					aria-label="Assign {template.name} to a client"
					onclick={() => openAssign(template)}>Assign</button
				>
			{/if}
			<form method="POST" action="?/duplicate" class="m-0 flex" use:enhance>
				<input type="hidden" name="id" value={template.id} />
				<button class={rowAction} aria-label="Duplicate {template.name}">Duplicate</button>
			</form>
			<form method="POST" action="?/archive" class="m-0 flex" use:enhance>
				<input type="hidden" name="id" value={template.id} />
				<input type="hidden" name="archived" value={template.is_archived ? 'false' : 'true'} />
				<button
					class={rowAction}
					aria-label="{template.is_archived ? 'Restore' : 'Archive'} {template.name}"
					>{template.is_archived ? 'Restore' : 'Archive'}</button
				>
			</form>
		</div>
	</li>
{/snippet}

<div class={flow}>
	<header class="flex flex-wrap items-center justify-between gap-4">
		<h1 class="mb-0">Templates</h1>
		<div class="flex flex-wrap gap-3">
			<a class={primary} href="/admin/templates/new?kind=workout">+ Workout</a>
			<a class={secondary} href="/admin/templates/new?kind=nutrition">+ Nutrition</a>
		</div>
	</header>

	{#if form?.message}<p class={error} role="alert">{form.message}</p>{/if}
	{#if form?.updated}<p class={success} role="status">
			{form.updated}
			{#if 'assignedClient' in form && form.assignedClient}<a
					class="ml-2 font-semibold text-[#175e4d]"
					href="/admin/clients/{form.assignedClient}">Open client →</a
				>{/if}
		</p>{/if}
	{#if data.loadError}<p class={error} role="alert">{data.loadError}</p>{/if}

	{#if data.templates.length === 0}
		{#if !data.loadError}
			<p class="rounded-[10px] border border-dashed border-line p-6 text-center text-muted">
				No templates yet. Create the first one above.
			</p>
		{/if}
	{:else}
		<div class="flex flex-wrap items-center gap-3">
			<label class="m-0 min-w-[200px] flex-1">
				<span class="sr-only">Search templates</span>
				<input type="search" placeholder="Search by name or goal" bind:value={query} />
			</label>
			<div class="flex flex-wrap gap-2" role="group" aria-label="Filter by type">
				{#each filters as filter (filter.value)}
					<button
						type="button"
						class={kind === filter.value ? tabSelected : tabIdle}
						aria-pressed={kind === filter.value}
						onclick={() => (kind = filter.value)}
						>{filter.label}
						<span class="ml-2 text-[0.8rem] font-normal opacity-75">{countFor(filter.value)}</span
						></button
					>
				{/each}
			</div>
		</div>

		{#if active.length === 0}
			<p class="rounded-[10px] border border-dashed border-line p-6 text-center text-muted">
				{query
					? 'No templates match.'
					: `No active ${kind === 'all' ? '' : `${kindLabel(kind).toLowerCase()} `}templates.`}
			</p>
		{:else}
			<ul class="m-0! grid list-none gap-3 p-0">
				{#each active as template (template.id)}
					{@render templateRow(template)}
				{/each}
			</ul>
		{/if}

		{#if archived.length > 0}
			<details class="{card} p-4!">
				<summary class="cursor-pointer font-semibold text-ink">Archived ({archived.length})</summary
				>
				<p class={help}>
					Archived templates cannot be newly assigned. Restore one to use it again.
				</p>
				<ul class="m-0! mt-3! grid list-none gap-3 p-0">
					{#each archived as template (template.id)}
						{@render templateRow(template)}
					{/each}
				</ul>
			</details>
		{/if}
	{/if}
</div>

<dialog
	bind:this={dialog}
	class="m-auto w-[min(100%-2rem,480px)] rounded-xl border border-line bg-paper p-0 text-ink backdrop:bg-ink/50"
	aria-labelledby="assign-title"
>
	{#if assigning}
		<form
			method="POST"
			action="?/assign"
			class="grid gap-4 p-6"
			use:enhance={() => {
				busy = true;
				return async ({ update, result }) => {
					await update();
					busy = false;
					if (result.type === 'success') dialog?.close();
				};
			}}
		>
			<input type="hidden" name="workout_template_id" value={assigning.id} />
			<div>
				<h2 id="assign-title" class="mb-1! text-[1.6rem]!">Assign {assigning.name}</h2>
				<p class="{help} m-0!">Starts on the first phase and ends the client's current program.</p>
			</div>
			<label class="grid gap-1 font-semibold"
				>Client<span class={requiredMark} aria-hidden="true">*</span>
				<select
					name="client_id"
					required
					bind:value={clientId}
					onchange={() => (nutritionChoice = chosenClient?.nutritionId ? 'keep' : '')}
				>
					<option value="" disabled>Choose a client</option>
					{#each data.clients as client (client.id)}
						<option value={client.id}
							>{client.name}{client.workout ? ` (now: ${client.workout})` : ''}</option
						>
					{/each}
				</select>
			</label>
			<label class="grid gap-1 font-semibold"
				>Nutrition
				<select name="nutrition_template_id" bind:value={nutritionChoice}>
					{#if chosenClient?.nutritionId}<option value="keep">Keep current plan</option>{/if}
					<option value="">None</option>
					{#each nutritionTemplates as template (template.id)}
						<option value={template.id}>{template.name}</option>
					{/each}
				</select>
			</label>
			{#if form?.message}<p class="{error} m-0!" role="alert">{form.message}</p>{/if}
			<div class="flex flex-wrap justify-end gap-3">
				<button type="button" class={secondary} onclick={() => dialog?.close()}>Cancel</button>
				<button class={primary} disabled={busy || !clientId}
					>{busy ? 'Assigning…' : 'Assign'}</button
				>
			</div>
		</form>
	{/if}
</dialog>

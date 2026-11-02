<script lang="ts">
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
		tabSelected
	} from '$lib/features/cms/styles';
	let { data, form } = $props();

	const goalLabel = (value: string) => goals.find((goal) => goal.value === value)?.label ?? value;
	const kindLabel = (value: string) =>
		templateKinds.find((kind) => kind.value === value)?.label ?? value;
	const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });
	const updatedLabel = (value: string | null) => {
		const date = value ? new Date(value) : null;
		return date && !Number.isNaN(date.getTime()) ? dateFormat.format(date) : '';
	};

	let kind = $state('all');
	const filters = [{ value: 'all', label: 'All' }, ...templateKinds];

	const visible = $derived(
		data.templates.filter((template) => kind === 'all' || template.kind === kind)
	);
	const active = $derived(visible.filter((template) => !template.is_archived));
	const archived = $derived(visible.filter((template) => template.is_archived));
	const countFor = (value: string) =>
		data.templates.filter((template) => value === 'all' || template.kind === value).length;

	const row =
		'relative flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[10px] border border-line bg-paper p-4 hover:border-cyan-ink focus-within:border-cyan-ink';
	const rowAction = `${subtle} relative z-10 hover:bg-[#eef3f3] hover:text-ink`;
</script>

<svelte:head><title>Templates | Configains CMS</title></svelte:head>

{#snippet templateRow(template: (typeof data.templates)[number])}
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
			<span class="truncate text-[0.85rem] text-muted">{goalLabel(template.goal)}</span>
		</span>
		<span class={badgeNeutral}>{kindLabel(template.kind)}</span>
		<div class="flex items-center gap-1">
			<form method="POST" action="?/duplicate" class="m-0 flex">
				<input type="hidden" name="id" value={template.id} />
				<button class={rowAction} aria-label="Duplicate {template.name}">Duplicate</button>
			</form>
			<form method="POST" action="?/archive" class="m-0 flex">
				<input type="hidden" name="id" value={template.id} />
				<input type="hidden" name="archived" value={template.is_archived ? 'false' : 'true'} />
				<button
					class={rowAction}
					aria-label="{template.is_archived ? 'Restore' : 'Archive'} {template.name}"
					>{template.is_archived ? 'Restore' : 'Archive'}</button
				>
			</form>
		</div>
		<span aria-hidden="true" class="text-muted">→</span>
	</li>
{/snippet}

<div class={flow}>
	<header class="flex flex-wrap items-center justify-between gap-4">
		<h1 class="mb-0">Program templates</h1>
		<div class="flex flex-wrap gap-3">
			<a class={primary} href="/admin/templates/new?kind=workout">+ Workout template</a>
			<a class={secondary} href="/admin/templates/new?kind=nutrition">+ Nutrition template</a>
		</div>
	</header>

	{#if form?.message}<p class={error} role="alert">{form.message}</p>{/if}
	{#if form?.updated}<p class={success} role="status">Template updated.</p>{/if}
	{#if data.loadError}<p class={error} role="alert">{data.loadError}</p>{/if}

	{#if data.templates.length === 0}
		{#if !data.loadError}
			<p class="rounded-[10px] border border-dashed border-line p-6 text-center text-muted">
				No templates yet. Create the first one above.
			</p>
		{/if}
	{:else}
		<div class="flex flex-wrap gap-2" role="group" aria-label="Filter by type">
			{#each filters as filter (filter.value)}
				<button
					type="button"
					class="justify-self-auto! {kind === filter.value ? tabSelected : tabIdle}"
					aria-pressed={kind === filter.value}
					onclick={() => (kind = filter.value)}
					>{filter.label}
					<span class="ml-2 text-[0.8rem] font-normal opacity-75">{countFor(filter.value)}</span
					></button
				>
			{/each}
		</div>

		{#if active.length === 0}
			<p class="rounded-[10px] border border-dashed border-line p-6 text-center text-muted">
				No active {kind === 'all' ? '' : `${kindLabel(kind).toLowerCase()} `}templates.
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

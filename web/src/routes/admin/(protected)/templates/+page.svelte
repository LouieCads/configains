<script lang="ts">
	import { goals, templateKinds } from '$lib/coaching/template';
	import {
		card,
		error,
		flow,
		help,
		primary,
		secondary,
		subtle,
		success
	} from '$lib/features/cms/styles';
	let { data, form } = $props();

	const goalLabel = (value: string) => goals.find((goal) => goal.value === value)?.label ?? value;
	const kindLabel = (value: string) =>
		templateKinds.find((kind) => kind.value === value)?.label ?? value;
</script>

<svelte:head><title>Templates | Configains CMS</title></svelte:head>
<div class={flow}>
	<h1>Program templates</h1>
	<p class={help}>
		Templates are the approved programs clients are assigned. Changes apply to clients on their next
		view. Archive a template to stop assigning it without affecting clients already on it.
	</p>

	<p class="my-5 flex flex-wrap gap-3">
		<a class={primary} href="/admin/templates/new?kind=workout">New workout template</a>
		<a class={secondary} href="/admin/templates/new?kind=nutrition">New nutrition template</a>
	</p>

	{#if form?.message}<p class={error} role="alert">{form.message}</p>{/if}
	{#if form?.updated}<p class={success} role="status">Template updated.</p>{/if}

	<section class={card}>
		{#if data.loadError}<p class={error} role="alert">{data.loadError}</p>{/if}
		{#if data.templates.length === 0 && !data.loadError}
			<p>No templates yet. Create the first one above.</p>
		{:else}
			<ul>
				{#each data.templates as template (template.id)}
					<li
						class="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line py-3 first:pt-0 last:border-b-0 last:pb-0"
					>
						<strong>{template.name}</strong>
						<span class="{help} my-0!">
							{kindLabel(template.kind)} · {goalLabel(template.goal)}{template.is_archived
								? ' · Archived'
								: ''}
						</span>
						<a class="font-semibold text-cyan-ink underline" href="/admin/templates/{template.id}"
							>Edit</a
						>
						<form method="POST" action="?/duplicate" class="inline">
							<input type="hidden" name="id" value={template.id} />
							<button class={subtle}>Duplicate</button>
						</form>
						<form method="POST" action="?/archive" class="inline">
							<input type="hidden" name="id" value={template.id} />
							<input
								type="hidden"
								name="archived"
								value={template.is_archived ? 'false' : 'true'}
							/>
							<button class={subtle}>{template.is_archived ? 'Restore' : 'Archive'}</button>
						</form>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>

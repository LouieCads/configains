<script lang="ts">
	import { enhance } from '$app/forms';
	import { openStatuses } from '$lib/coaching/labels';
	import {
		badgeNeutral,
		badgeOk,
		badgeWarn,
		card,
		error,
		flow,
		help,
		primary,
		secondary,
		success,
		tabIdle,
		tabSelected,
		requiredMark
	} from '$lib/features/cms/styles';
	let { form, data } = $props();

	const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });
	let inviteOpen = $state(false);
	let inviting = $state(false);
	$effect(() => {
		if (form?.message) inviteOpen = true;
	});

	type Client = (typeof data.clients)[number];
	/** Things waiting on the coach, most urgent first. */
	const needs = (client: Client) =>
		[
			client.pendingCheckIns > 0 &&
				`${client.pendingCheckIns} check-in${client.pendingCheckIns === 1 ? '' : 's'} to review`,
			client.assessmentStatus &&
				openStatuses.includes(client.assessmentStatus) &&
				'Assessment to review',
			!client.program && client.assessmentStatus && 'No program'
		].filter((item): item is string => !!item);

	let query = $state('');
	let filter = $state<'all' | 'attention' | 'human' | 'ai'>('all');
	const filters = [
		{ value: 'all', label: 'All' },
		{ value: 'attention', label: 'Needs you' },
		{ value: 'human', label: 'Human' },
		{ value: 'ai', label: 'AI' }
	] as const;
	const matchesFilter = (client: Client, value: typeof filter) =>
		value === 'all' ||
		(value === 'attention' && needs(client).length > 0) ||
		(value === 'human' && client.coaching_mode === 'human') ||
		(value === 'ai' && client.coaching_mode !== 'human');

	const visible = $derived.by(() => {
		const text = query.trim().toLowerCase();
		return data.clients
			.filter(
				(client) =>
					matchesFilter(client, filter) &&
					(!text || (client.display_name ?? '').toLowerCase().includes(text))
			)
			.sort((a, b) => needs(b).length - needs(a).length);
	});
	const countFor = (value: typeof filter) =>
		data.clients.filter((client) => matchesFilter(client, value)).length;
</script>

<svelte:head><title>Clients | Configains CMS</title></svelte:head>
<div class={flow}>
	<header class="flex flex-wrap items-center justify-between gap-4">
		<h1 class="mb-0">Clients</h1>
		<button
			type="button"
			class={inviteOpen ? secondary : primary}
			aria-expanded={inviteOpen}
			aria-controls="invite-client"
			onclick={() => (inviteOpen = !inviteOpen)}>{inviteOpen ? 'Cancel' : '+ Invite client'}</button
		>
	</header>

	{#if form?.invited}<p class={success} role="status">Invitation sent to {form.email}.</p>{/if}

	<section id="invite-client" class="{card} p-5!" hidden={!inviteOpen}>
		{#if form?.message}<p class="{error} mt-0!" role="alert">{form.message}</p>{/if}
		<form
			method="POST"
			action="?/invite"
			class="m-0! flex! flex-wrap items-end gap-3!"
			use:enhance={() => {
				inviting = true;
				return async ({ update, result }) => {
					await update();
					inviting = false;
					if (result.type === 'success') inviteOpen = false;
				};
			}}
		>
			<label class="m-0 grid min-w-[220px] flex-[2] gap-1"
				>Email<span class={requiredMark} aria-hidden="true">*</span>
				<input name="email" type="email" required value={form?.email ?? ''} />
			</label>
			<label class="m-0 grid min-w-[180px] flex-1 gap-1"
				>Name
				<input name="display_name" type="text" maxlength="120" />
			</label>
			<button class={primary} disabled={inviting}>{inviting ? 'Sending…' : 'Send invite'}</button>
		</form>
		<p class="{help} mb-0!">They get an email to set a password, then can sign in.</p>
	</section>

	{#if data.loadError}<p class={error} role="alert">{data.loadError}</p>{/if}
	{#if data.clients.length === 0 && !data.loadError}
		<p class="rounded-[10px] border border-dashed border-line p-6 text-center text-muted">
			No clients yet. Invite your first client to get started.
		</p>
	{:else if data.clients.length > 0}
		<div class="flex flex-wrap items-center gap-3">
			<label class="m-0 min-w-[200px] flex-1">
				<span class="sr-only">Search clients</span>
				<input type="search" placeholder="Search by name" bind:value={query} />
			</label>
			<div class="flex flex-wrap gap-2" role="group" aria-label="Filter clients">
				{#each filters as option (option.value)}
					<button
						type="button"
						class={filter === option.value ? tabSelected : tabIdle}
						aria-pressed={filter === option.value}
						onclick={() => (filter = option.value)}
						>{option.label}
						<span class="ml-2 text-[0.8rem] font-normal opacity-75">{countFor(option.value)}</span
						></button
					>
				{/each}
			</div>
		</div>

		{#if visible.length === 0}
			<p class="rounded-[10px] border border-dashed border-line p-6 text-center text-muted">
				{filter === 'attention' && !query ? 'Nothing waiting. All caught up.' : 'No clients match.'}
			</p>
		{:else}
			<ul class="m-0! grid list-none gap-3 p-0">
				{#each visible as client (client.id)}
					{@const todo = needs(client)}
					<li>
						<a
							href="/admin/clients/{client.id}"
							class={[
								'flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[10px] border bg-paper p-4 text-ink no-underline hover:border-cyan-ink',
								todo.length > 0 ? 'border-[#efb8ac]' : 'border-line'
							]}
						>
							<span class="grid min-w-0 flex-1 basis-48">
								<strong class="truncate">{client.display_name ?? 'Unnamed client'}</strong>
								<span class="truncate text-[0.85rem] text-muted"
									>{client.program ?? 'No program yet'} · Joined {dateFormat.format(
										new Date(client.created_at)
									)}</span
								>
							</span>
							{#each todo as item (item)}<span class={badgeWarn}>{item}</span>{/each}
							<span class={client.coaching_mode === 'human' ? badgeOk : badgeNeutral}
								>{client.coaching_mode === 'human' ? 'Human' : 'AI'}</span
							>
							<span aria-hidden="true" class="text-muted">→</span>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>

<script lang="ts">
	import Archive from '@lucide/svelte/icons/archive';
	import Bot from '@lucide/svelte/icons/bot';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ListTodo from '@lucide/svelte/icons/list-todo';
	import User from '@lucide/svelte/icons/user';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import Send from '@lucide/svelte/icons/send';
	import X from '@lucide/svelte/icons/x';
	import { enhance } from '$app/forms';
	import { emailExample } from '$lib/auth/password';
	import { openStatuses } from '$lib/coaching/labels';
	import {
		badgeNeutral,
		badgeOk,
		badgeWarn,
		card,
		error,
		help,
		neutral,
		primary,
		tabIdle,
		tabSelected,
		requiredMark
	} from '$lib/features/cms/styles';
	import { page } from '$app/state';
	import { toast } from '$lib/features/cms/toast.svelte';
	let { form, data } = $props();
	const deleted = $derived(page.url.searchParams.get('deleted') === '1');

	let inviteOpen = $state(false);
	let inviting = $state(false);
	$effect(() => {
		if (form?.message) inviteOpen = true;
	});
	$effect(() => {
		if (form?.invited)
			toast.success(`${form.resent ? 'Invite resent to' : 'Invite sent to'} ${form.email}`);
		else if (form?.message) toast.error(form.message);
	});
	$effect(() => {
		if (deleted && !form) toast.success('Client deleted');
	});

	type Client = (typeof data.clients)[number];
	/** Things waiting on the coach, most urgent first. */
	const needs = (client: Client) =>
		[
			client.pendingCheckIns > 0 &&
				`${client.pendingCheckIns} check-in${client.pendingCheckIns === 1 ? '' : 's'}`,
			client.unreadMessages > 0 &&
				`${client.unreadMessages} new message${client.unreadMessages === 1 ? '' : 's'}`,
			client.assessmentStatus && openStatuses.includes(client.assessmentStatus) && 'New assessment',
			!client.program && client.assessmentStatus && 'No program'
		].filter((item): item is string => !!item);

	let query = $state('');
	let filter = $state<'all' | 'attention' | 'human' | 'ai' | 'archived'>('all');
	const filters = [
		{ value: 'all', label: 'All' },
		{ value: 'attention', label: 'To do' },
		{ value: 'human', label: 'Human' },
		{ value: 'ai', label: 'AI' },
		{ value: 'archived', label: 'Archived' }
	] as const;
	const filterIcons: Partial<Record<(typeof filters)[number]['value'], typeof User>> = {
		attention: ListTodo,
		human: User,
		ai: Bot,
		archived: Archive
	};
	/** Archived clients only show under their own filter. */
	const matchesFilter = (client: Client, value: typeof filter) =>
		value === 'archived'
			? Boolean(client.archived_at)
			: !client.archived_at &&
				(value === 'all' ||
					(value === 'attention' && needs(client).length > 0) ||
					(value === 'human' && client.coaching_mode === 'human') ||
					(value === 'ai' && client.coaching_mode !== 'human'));

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
<div class="grid gap-6">
	<header class="mt-3 flex flex-wrap items-center justify-between gap-4">
		<h1 class="m-0!">Clients</h1>
		<button
			type="button"
			class={inviteOpen ? neutral : primary}
			aria-expanded={inviteOpen}
			aria-controls="invite-client"
			onclick={() => (inviteOpen = !inviteOpen)}
			>{#if inviteOpen}<X size={18} aria-hidden="true" />Cancel{:else}<UserPlus
					size={18}
					aria-hidden="true"
				/>Invite client{/if}</button
		>
	</header>

	<section id="invite-client" class={card} hidden={!inviteOpen}>
		<h2 class="text-[1.5rem]!">Invite a client</h2>
		<form
			method="POST"
			action="?/invite"
			class="flex flex-wrap items-end gap-4"
			use:enhance={() => {
				inviting = true;
				return async ({ update, result }) => {
					await update();
					inviting = false;
					if (result.type === 'success') inviteOpen = false;
				};
			}}
		>
			<label class="grid min-w-[220px] flex-[2] gap-2 font-semibold"
				><span>Email<span class={requiredMark} aria-hidden="true">*</span></span>
				<input
					name="email"
					type="email"
					placeholder={emailExample}
					required
					value={form?.email ?? ''}
				/>
			</label>
			<label class="grid min-w-[180px] flex-1 gap-2 font-semibold"
				>Name
				<input name="display_name" type="text" maxlength="120" />
			</label>
			<button class={primary} disabled={inviting}
				><Send size={18} aria-hidden="true" />{inviting ? 'Sending…' : 'Send invite'}</button
			>
		</form>
		<p class="{help} mb-0!">They get an email to set a password.</p>
	</section>

	{#if data.loadError}<p class="{error} m-0!" role="alert">{data.loadError}</p>{/if}
	{#if data.clients.length === 0 && !data.loadError}
		<p class="m-0 rounded-[10px] border border-dashed border-line p-6 text-center text-muted">
			No clients yet.
		</p>
	{:else if data.clients.length > 0}
		<div class="flex flex-wrap items-center gap-3">
			<label class="min-w-[200px] flex-1">
				<span class="sr-only">Search clients</span>
				<input type="search" placeholder="Search by name" bind:value={query} />
			</label>
			<div class="flex flex-wrap gap-2" role="group" aria-label="Filter clients">
				{#each filters as option (option.value)}
					{@const Icon = filterIcons[option.value]}
					<button
						type="button"
						class={[filter === option.value ? tabSelected : tabIdle, 'gap-2']}
						aria-pressed={filter === option.value}
						onclick={() => (filter = option.value)}
						>{#if Icon}<Icon size={16} aria-hidden="true" />{/if}{option.label}
						<span class="ml-2 text-[0.8rem] font-normal opacity-75">{countFor(option.value)}</span
						></button
					>
				{/each}
			</div>
		</div>

		{#if visible.length === 0}
			<p class="m-0 rounded-[10px] border border-dashed border-line p-6 text-center text-muted">
				{filter === 'attention' && !query ? 'All caught up.' : 'No clients found.'}
			</p>
		{:else}
			<ul class="m-0 grid list-none gap-3 p-0">
				{#each visible as client (client.id)}
					{@const todo = needs(client)}
					<li>
						<a
							href="/admin/clients/{client.id}"
							class={[
								'flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[10px] border bg-paper px-4 py-3 text-ink no-underline hover:border-cyan-ink',
								todo.length > 0 ? 'border-[#efb8ac]' : 'border-line'
							]}
						>
							<span class="grid min-w-0 flex-1 basis-48 gap-1">
								<strong class="truncate text-[0.95rem]"
									>{client.display_name ?? 'Unnamed client'}</strong
								>
								<span class="truncate text-[0.8rem] text-muted"
									>{client.program ?? 'No program'}</span
								>
							</span>
							{#each todo.filter((item) => item !== 'No program') as item (item)}<span
									class={badgeWarn}>{item}</span
								>{/each}
							{#if client.coaching_mode === 'human'}
								<span class={badgeOk}><User size={14} aria-hidden="true" />Human</span>
							{:else}
								<span class={badgeNeutral}><Bot size={14} aria-hidden="true" />AI</span>
							{/if}
							<ChevronRight size={18} class="text-muted" aria-hidden="true" />
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>

<script lang="ts">
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
		success
	} from '$lib/features/cms/styles';
	let { form, data } = $props();

	const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });
	let inviteOpen = $state(false);
	$effect(() => {
		if (form?.message) inviteOpen = true;
	});
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

	<section id="invite-client" class={card} hidden={!inviteOpen}>
		<h2>Invite a client</h2>
		<p class={help}>They get an email to set a password, then can sign in.</p>
		{#if form?.message}<p class={error} role="alert">{form.message}</p>{/if}
		<form method="POST" action="?/invite">
			<label
				>Email address
				<input name="email" type="email" required value={form?.email ?? ''} />
			</label>
			<label
				>Name (optional)
				<input name="display_name" type="text" maxlength="120" />
			</label>
			<button class={primary}>Send invitation</button>
		</form>
	</section>

	{#if data.loadError}<p class={error} role="alert">{data.loadError}</p>{/if}
	{#if data.clients.length === 0 && !data.loadError}
		<p class="rounded-[10px] border border-dashed border-line p-6 text-center text-muted">
			No clients yet. Invite your first client to get started.
		</p>
	{:else}
		<ul class="m-0! grid list-none gap-3 p-0">
			{#each data.clients as client (client.id)}
				<li>
					<a
						href="/admin/clients/{client.id}"
						class="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[10px] border border-line bg-paper p-4 text-ink no-underline hover:border-cyan-ink"
					>
						<span class="grid min-w-0 flex-1 basis-48">
							<strong class="truncate">{client.display_name ?? 'Unnamed client'}</strong>
							<span class="truncate text-[0.85rem] text-muted"
								>{client.program ?? 'No program yet'}</span
							>
						</span>
						{#if client.pendingCheckIns > 0}<span class={badgeWarn}
								>{client.pendingCheckIns} check-in{client.pendingCheckIns === 1 ? '' : 's'} to review</span
							>{/if}
						<span class={client.coaching_mode === 'human' ? badgeOk : badgeNeutral}
							>{client.coaching_mode === 'human' ? 'Human coaching' : 'AI coaching'}</span
						>
						<span class="text-[0.8rem] text-muted"
							>Joined {dateFormat.format(new Date(client.created_at))}</span
						>
						<span aria-hidden="true" class="text-muted">→</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>

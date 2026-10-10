<script lang="ts">
	import { card, error, help, primary, success } from '$lib/features/cms/styles';
	let { form, data } = $props();

	const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });
</script>

<svelte:head><title>Clients | Configains CMS</title></svelte:head>
<h1>Clients</h1>

<section class={card}>
	<h2>Invite a client</h2>
	<p class={help}>
		Clients sign in only after you invite them. They get an email to set a password.
	</p>
	{#if form?.message}<p class={error} role="alert">{form.message}</p>{/if}
	{#if form?.invited}<p class={success} role="status">Invitation sent to {form.email}.</p>{/if}
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

<section class={card}>
	<h2>Assign a program</h2>
	<p class={help}>Ends the client's current program and starts the new one on its first phase.</p>
	{#if form?.assignMessage}<p class={error} role="alert">{form.assignMessage}</p>{/if}
	{#if form?.assigned}<p class={success} role="status">Program assigned.</p>{/if}
	{#if data.clients.length === 0}
		<p>Invite a client before assigning a program.</p>
	{:else if data.workoutTemplates.length === 0}
		<p>Create an active workout template first.</p>
	{:else}
		<form method="POST" action="?/assign">
			<label
				>Client
				<select name="client_id" required>
					{#each data.clients as client (client.id)}
						<option value={client.id}>{client.display_name ?? 'Unnamed client'}</option>
					{/each}
				</select>
			</label>
			<label
				>Workout template
				<select name="workout_template_id" required>
					{#each data.workoutTemplates as template (template.id)}
						<option value={template.id}>{template.name}</option>
					{/each}
				</select>
			</label>
			<label
				>Nutrition template (optional)
				<select name="nutrition_template_id">
					<option value="">None</option>
					{#each data.nutritionTemplates as template (template.id)}
						<option value={template.id}>{template.name}</option>
					{/each}
				</select>
			</label>
			<button class={primary}>Assign program</button>
		</form>
	{/if}
</section>

<section class={card}>
	<h2>Current clients</h2>
	{#if data.loadError}<p class={error} role="alert">{data.loadError}</p>{/if}
	{#if data.clients.length === 0 && !data.loadError}
		<p>No clients yet.</p>
	{:else}
		<ul>
			{#each data.clients as client (client.id)}
				<li>
					<a class="font-semibold underline" href="/admin/clients/{client.id}"
						>{client.display_name ?? 'Unnamed client'}</a
					>
					<span class={help}>
						{client.coaching_mode === 'human' ? 'Human coaching' : 'AI coaching'} · joined {dateFormat.format(
							new Date(client.created_at)
						)}
					</span>
				</li>
			{/each}
		</ul>
	{/if}
</section>

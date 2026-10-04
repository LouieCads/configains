<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthCard from '$lib/features/cms/AuthCard.svelte';
	let { form } = $props();
	let busy = $state(false);
</script>

<AuthCard
	title="Choose a new password."
	intro="Use at least 12 characters. A few unrelated words make a useful passphrase."
>
	{#if form?.message}<p class="cms-error" role="alert">{form.message}</p>{/if}
	{#if !form?.updated}
		<form
			method="POST"
			use:enhance={() => {
				busy = true;
				return async ({ update }) => {
					await update();
					busy = false;
				};
			}}
		>
			<label
				>New password<input
					name="password"
					type="password"
					autocomplete="new-password"
					minlength="12"
					maxlength="128"
					required
				/></label
			>
			<label
				>Confirm new password<input
					name="confirmation"
					type="password"
					autocomplete="new-password"
					minlength="12"
					maxlength="128"
					required
				/></label
			>
			<button class="cms-primary" disabled={busy}>{busy ? 'Updating…' : 'Update password'}</button>
		</form>
	{:else}
		<form method="POST" action="/admin/logout"><button class="cms-primary">Sign out</button></form>
	{/if}
	<a class="cms-auth-link" href="/admin/forgot-password">Request a new reset link</a>
	<a class="cms-auth-link" href="/admin/login">Back to sign in</a>
</AuthCard>

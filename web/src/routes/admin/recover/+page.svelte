<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthCard from '$lib/features/cms/AuthCard.svelte';
	let { data, form } = $props();
	let busy = $state(false);
</script>

<AuthCard
	title="Reset your password."
	intro="Continue to choose a new password for your Configains admin account."
>
	{#if data.localAdminDemo}
		<p class="cms-error" role="alert">Recovery links cannot be used in the local demo.</p>
	{:else if !data.tokenHash}
		<p class="cms-error" role="alert">This recovery link is invalid. Request a new link.</p>
	{:else}
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
			{#if form?.message}<p class="cms-error" role="alert">{form.message}</p>{/if}
			<input type="hidden" name="token_hash" value={data.tokenHash} />
			<button class="cms-primary" disabled={busy}
				>{busy ? 'Checking link…' : 'Continue to reset password'}</button
			>
		</form>
	{/if}
	<a class="cms-auth-link" href="/admin/forgot-password">Request a new reset link</a>
	<a class="cms-auth-link" href="/admin/login">Back to sign in</a>
</AuthCard>

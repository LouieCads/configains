<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthCard from '$lib/features/cms/AuthCard.svelte';
	import { authLink, authSubmit, error, primary } from '$lib/features/cms/styles';
	let { data, form } = $props();
	let busy = $state(false);
</script>

<AuthCard
	title="Reset your password."
	intro="Continue to choose a new password for your Configains admin account."
>
	{#if data.localAdminDemo}
		<p class={error} role="alert">Recovery links cannot be used in the local demo.</p>
	{:else if !data.tokenHash && !data.authCode}
		<p class={error} role="alert">This recovery link is invalid. Request a new link.</p>
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
			{#if form?.message}<p class={error} role="alert">{form.message}</p>{/if}
			{#if data.tokenHash}<input type="hidden" name="token_hash" value={data.tokenHash} />{/if}
			{#if data.authCode}<input type="hidden" name="code" value={data.authCode} />{/if}
			<button class="{primary} {authSubmit}" disabled={busy}
				>{busy ? 'Checking link…' : 'Continue to reset password'}</button
			>
		</form>
	{/if}
	<a class={authLink} href="/admin/forgot-password">Request a new reset link</a>
	<a class={authLink} href="/admin/login">Back to sign in</a>
</AuthCard>

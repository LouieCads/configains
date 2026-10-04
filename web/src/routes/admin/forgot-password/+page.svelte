<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthCard from '$lib/features/cms/AuthCard.svelte';
	let { data, form } = $props();
	let busy = $state(false);
</script>

<AuthCard
	title="Forgot your password?"
	intro="Enter your admin email to request a password reset link."
>
	{#if data.localAdminDemo}
		<p class="editor-help">
			Password recovery is available on the live website. The local demo does not use a password.
		</p>
	{:else if form?.sent}
		<p class="cms-success" role="status">
			If this email has an account, a reset link will arrive shortly. Check your inbox and spam
			folder.
		</p>
	{:else}
		{#if data.expired}<p class="cms-error" role="alert">
				Your recovery session has expired. Request a new link.
			</p>{/if}
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
			<label
				>Email address<input
					name="email"
					type="email"
					autocomplete="email"
					maxlength="254"
					required
				/></label
			>
			<button class="cms-primary" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
		</form>
	{/if}
	<a class="cms-auth-link" href="/admin/login">Back to sign in</a>
</AuthCard>

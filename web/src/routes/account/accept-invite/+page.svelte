<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		authCard,
		authLabel,
		authSubmit,
		brand,
		error,
		eyebrow,
		help,
		loginPage,
		primary,
		studio
	} from '$lib/features/cms/styles';
	let { form, data } = $props();
	let busy = $state(false);
	const hasLink = $derived(Boolean(data.tokenHash || data.authCode));
</script>

<svelte:head
	><title>Set your password | Configains</title><meta
		name="robots"
		content="noindex, nofollow"
	/></svelte:head
>
<main class="{studio} {loginPage}">
	<div class={authCard}>
		<a href="/" class={brand}>CONFIGAINS.</a>
		<p class={eyebrow}>YOUR ACCOUNT</p>
		<h1>Welcome to Configains.</h1>
		{#if hasLink}
			<p>Choose a password to finish setting up your account.</p>
			{#if form?.message}<p class={error} role="alert">{form.message}</p>{/if}
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
				<input type="hidden" name="token_hash" value={data.tokenHash ?? ''} />
				<input type="hidden" name="code" value={data.authCode ?? ''} />
				<label class={authLabel}
					>New password<input
						name="password"
						type="password"
						autocomplete="new-password"
						minlength="12"
						maxlength="128"
						required
					/></label
				>
				<label class={authLabel}
					>Confirm password<input
						name="confirmation"
						type="password"
						autocomplete="new-password"
						minlength="12"
						maxlength="128"
						required
					/></label
				>
				<button class="{primary} {authSubmit}" disabled={busy}
					>{busy ? 'Saving…' : 'Set password'}</button
				>
			</form>
		{:else}
			<p class={error} role="alert">
				This invitation link is incomplete. Ask for a new invitation.
			</p>
		{/if}
		<p class={help}>Use at least 12 characters.</p>
	</div>
</main>

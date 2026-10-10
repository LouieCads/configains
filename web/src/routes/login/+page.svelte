<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		authCard,
		authLabel,
		authSubmit,
		brand,
		error,
		eyebrow,
		loginPage,
		primary,
		studio,
		success
	} from '$lib/features/cms/styles';
	let { form, data } = $props();
	let busy = $state(false);
</script>

<svelte:head
	><title>Sign in | Configains</title><meta
		name="robots"
		content="noindex, nofollow"
	/></svelte:head
>
<main class="{studio} {loginPage}">
	<form
		class={authCard}
		method="POST"
		use:enhance={() => {
			busy = true;
			return async ({ update }) => {
				await update();
				busy = false;
			};
		}}
	>
		<a href="/" class={brand}>CONFIGAINS.</a>
		<p class={eyebrow}>CLIENT ACCOUNT</p>
		<h1>Sign in.</h1>
		<p>Accounts are by invitation. Use the email address Cash invited.</p>
		{#if form?.message}<p class={error} role="alert">{form.message}</p>{/if}
		{#if data.passwordSet}<p class={success} role="status">
				Password set. Sign in to continue.
			</p>{/if}
		<label class={authLabel}
			>Email address<input
				name="email"
				type="email"
				autocomplete="username"
				required
				value={form?.email ?? ''}
			/></label
		>
		<label class={authLabel}
			>Password<input
				name="password"
				type="password"
				autocomplete="current-password"
				required
			/></label
		>
		<button class="{primary} {authSubmit}" disabled={busy}
			>{busy ? 'Signing in…' : 'Sign in'}</button
		>
	</form>
</main>

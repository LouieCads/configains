<script lang="ts">
	import KeyRound from '@lucide/svelte/icons/key-round';
	import { enhance } from '$app/forms';
	import PasswordFields from '$lib/features/forms/PasswordFields.svelte';
	import {
		authCard,
		authSubmit,
		brand,
		error,
		loginPage,
		primary,
		studio
	} from '$lib/features/cms/styles';
	let { form } = $props();
	let busy = $state(false);
</script>

<svelte:head
	><title>Choose a new password | Configains</title><meta
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
		<h1>Choose a new password.</h1>
		<p>Your plan and progress stay safe.</p>
		{#if form?.message}<p class={error} role="alert">{form.message}</p>{/if}
		<PasswordFields />
		<button class="{primary} {authSubmit}" disabled={busy}
			><KeyRound size={18} aria-hidden="true" />{busy ? 'Saving…' : 'Update password'}</button
		>
	</form>
</main>

<script lang="ts">
	import KeyRound from '@lucide/svelte/icons/key-round';
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
		studio,
		requiredMark
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
		<p class={eyebrow}>YOUR ACCOUNT</p>
		<h1>Choose a new password.</h1>
		<p>Your plan and progress stay safe.</p>
		{#if form?.message}<p class={error} role="alert">{form.message}</p>{/if}
		<label class={authLabel}
			><span>New password<span class={requiredMark} aria-hidden="true">*</span></span><input
				name="password"
				type="password"
				autocomplete="new-password"
				minlength="12"
				maxlength="128"
				required
			/></label
		>
		<label class={authLabel}
			><span>Confirm password<span class={requiredMark} aria-hidden="true">*</span></span><input
				name="confirmation"
				type="password"
				autocomplete="new-password"
				minlength="12"
				maxlength="128"
				required
			/></label
		>
		<button class="{primary} {authSubmit}" disabled={busy}
			><KeyRound size={18} aria-hidden="true" />{busy ? 'Saving…' : 'Update password'}</button
		>
		<p class={help}>At least 12 characters.</p>
	</form>
</main>

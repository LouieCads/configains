<script lang="ts">
	import KeyRound from '@lucide/svelte/icons/key-round';
	import LogOut from '@lucide/svelte/icons/log-out';
	import { enhance } from '$app/forms';
	import AuthCard from '$lib/features/cms/AuthCard.svelte';
	import {
		authLabel,
		authLink,
		authSubmit,
		error,
		primary,
		requiredMark
	} from '$lib/features/cms/styles';
	let { form } = $props();
	let busy = $state(false);
</script>

<AuthCard
	title="Choose a new password."
	intro="Use at least 12 characters. A few unrelated words make a useful passphrase."
>
	{#if form?.message}<p class={error} role="alert">{form.message}</p>{/if}
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
				><span>Confirm new password<span class={requiredMark} aria-hidden="true">*</span></span
				><input
					name="confirmation"
					type="password"
					autocomplete="new-password"
					minlength="12"
					maxlength="128"
					required
				/></label
			>
			<button class="{primary} {authSubmit}" disabled={busy}
				><KeyRound size={18} aria-hidden="true" />{busy ? 'Updating…' : 'Update password'}</button
			>
		</form>
	{:else}
		<form method="POST" action="/admin/logout">
			<button class="{primary} {authSubmit}"><LogOut size={18} aria-hidden="true" />Sign out</button
			>
		</form>
	{/if}
	<a class={authLink} href="/admin/forgot-password">Request a new reset link</a>
	<a class={authLink} href="/admin/login">Back to sign in</a>
</AuthCard>

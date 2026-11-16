<script lang="ts">
	import KeyRound from '@lucide/svelte/icons/key-round';
	import LogIn from '@lucide/svelte/icons/log-in';
	import LogOut from '@lucide/svelte/icons/log-out';
	import { enhance } from '$app/forms';
	import {
		authCard,
		authLabel,
		authLink,
		authSubmit,
		brand,
		error,
		eyebrow,
		help,
		loginPage,
		primary,
		secondary,
		studio,
		requiredMark
	} from '$lib/features/cms/styles';
	let { form, data } = $props();
	let busy = $state(false);
	const hasLink = $derived(Boolean(data.tokenHash || data.authCode));
</script>

<svelte:head
	><title>Welcome to Configains</title><meta
		name="robots"
		content="noindex, nofollow"
	/></svelte:head
>
<main class="{studio} {loginPage}">
	<div class={authCard}>
		<a href="/" class={brand}>CONFIGAINS.</a>
		<p class={eyebrow}>YOUR ACCOUNT</p>

		{#if data.signedIn}
			<!-- Already a client on this device: no second account, and the invitation is left unused. -->
			<h1>You are already signed in.</h1>
			<p>You already have a Configains account, so there is nothing to set up.</p>
			<a class="{primary} {authSubmit}" href="/app">Go to your plan</a>
			<p class="{help} mt-5!">
				Setting up a different account? Sign out first, then open the invitation link again.
			</p>
			<form method="POST" action="/logout" class="m-0">
				<button class="{secondary} {authSubmit}"
					><LogOut size={18} aria-hidden="true" />Sign out</button
				>
			</form>
		{:else if form?.linkUsed}
			<!-- The usual reason: this client already used the link to set their password. -->
			<h1>This link has already been used.</h1>
			<p>
				If you have already set your password, your account is ready. Sign in with the email address
				and password you chose. Your program and logged progress are all there.
			</p>
			<a class="{primary} {authSubmit}" href="/login"
				><LogIn size={18} aria-hidden="true" />Client sign in</a
			>
			<a class={authLink} href="/forgot-password">Forgot your password?</a>
			<p class="{help} mt-5!">
				Have not set a password yet? The link may have expired. Ask Cash to send a new invitation.
			</p>
		{:else}
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
						><span>Confirm password<span class={requiredMark} aria-hidden="true">*</span></span
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
						><KeyRound size={18} aria-hidden="true" />{busy ? 'Saving…' : 'Set password'}</button
					>
				</form>
				<p class={help}>Use at least 12 characters.</p>
			{:else}
				<p class={error} role="alert">
					This invitation link is incomplete. Ask for a new invitation.
				</p>
			{/if}
			<!-- Always offered: a client who set their password earlier should never feel they must do it again. -->
			<p class="{help} mt-5! mb-0!">Already set your password?</p>
			<a class="{authLink} mt-1!" href="/login">Go to client sign in</a>
		{/if}
	</div>
</main>

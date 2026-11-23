<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import KeyRound from '@lucide/svelte/icons/key-round';
	import LogIn from '@lucide/svelte/icons/log-in';
	import Mail from '@lucide/svelte/icons/mail';
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
			<h1>You're already signed in.</h1>
			<p>Your account is ready.</p>
			<a class="{primary} {authSubmit}" href="/app"
				><ArrowRight size={18} aria-hidden="true" />Go to your plan</a
			>
			<p class="{help} mt-5!">Using a different account? Sign out, then open the invite again.</p>
			<form method="POST" action="/logout" class="m-0">
				<button class="{secondary} {authSubmit}"
					><LogOut size={18} aria-hidden="true" />Sign out</button
				>
			</form>
		{:else if form?.linkUsed}
			<!-- Expired and already-used links fail the same way, so offer both next steps equally. -->
			<h1>This link no longer works.</h1>
			<p>It expired or was already used. Pick what fits you:</p>
			<p class="{help} mt-5! mb-0!">I already set a password</p>
			<a class="{secondary} {authSubmit} mt-2!" href="/login"
				><LogIn size={18} aria-hidden="true" />Sign in</a
			>
			<a class={authLink} href="/forgot-password">Forgot your password?</a>
			<p class="{help} mt-6! mb-0!">I never set one</p>
			<a class="{secondary} {authSubmit} mt-2!" href="/contact"
				><Mail size={18} aria-hidden="true" />Ask Cash for a new invite</a
			>
		{:else}
			<h1>Welcome to Configains.</h1>
			{#if hasLink}
				<p>Choose a password to get started.</p>
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
				<p class={help}>At least 12 characters.</p>
				<!-- Always offered: a client who set their password earlier should never feel they must do it again. -->
				<p class="{help} mt-5! mb-0!">Already set your password?</p>
				<a class="{authLink} mt-1!" href="/login">Sign in</a>
			{:else}
				<p class={error} role="alert">This link is incomplete.</p>
				<a class="{secondary} {authSubmit}" href="/contact"
					><Mail size={18} aria-hidden="true" />Ask Cash for a new invite</a
				>
			{/if}
		{/if}
	</div>
</main>

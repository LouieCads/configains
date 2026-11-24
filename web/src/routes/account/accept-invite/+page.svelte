<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import KeyRound from '@lucide/svelte/icons/key-round';
	import LogIn from '@lucide/svelte/icons/log-in';
	import Mail from '@lucide/svelte/icons/mail';
	import LogOut from '@lucide/svelte/icons/log-out';
	import { enhance } from '$app/forms';
	import CoachContact from '$lib/components/layout/CoachContact.svelte';
	import PasswordFields from '$lib/features/forms/PasswordFields.svelte';
	import {
		authCard,
		authLink,
		authSubmit,
		brand,
		error,
		help,
		loginPage,
		primary,
		secondary,
		studio
	} from '$lib/features/cms/styles';
	let { form, data } = $props();
	let busy = $state(false);
	const inviteMail = $derived(
		`mailto:${data.site.brand.email}?subject=${encodeURIComponent('Configains invite request')}`
	);
	const hasLink = $derived(Boolean(data.tokenHash || data.authCode));
</script>

{#snippet socials()}
	{#if data.site.brand.socialLinks.length}<p class="{help} mt-3! mb-0!">
			Or message Cash on <CoachContact brand={data.site.brand} socialsOnly />
		</p>{/if}
{/snippet}

<svelte:head
	><title>Welcome to Configains</title><meta
		name="robots"
		content="noindex, nofollow"
	/></svelte:head
>
<main class="{studio} {loginPage}">
	<div class={authCard}>
		<a href="/" class={brand}>CONFIGAINS.</a>

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
			<a class="{secondary} {authSubmit} mt-2!" href={inviteMail}
				><Mail size={18} aria-hidden="true" />Email Cash for a new invite</a
			>
			{@render socials()}
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
					<PasswordFields />
					<button class="{primary} {authSubmit}" disabled={busy}
						><KeyRound size={18} aria-hidden="true" />{busy ? 'Saving…' : 'Set password'}</button
					>
				</form>
				<!-- Always offered: a client who set their password earlier should never feel they must do it again. -->
				<p class="{help} mt-5! mb-0!">Already set your password?</p>
				<a class="{authLink} mt-1!" href="/login">Sign in</a>
			{:else}
				<p class={error} role="alert">This link is incomplete.</p>
				<a class="{secondary} {authSubmit}" href={inviteMail}
					><Mail size={18} aria-hidden="true" />Email Cash for a new invite</a
				>
				{@render socials()}
			{/if}
		{/if}
	</div>
</main>

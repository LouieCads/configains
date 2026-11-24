<script lang="ts">
	import LogIn from '@lucide/svelte/icons/log-in';
	import Mail from '@lucide/svelte/icons/mail';
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import { enhance } from '$app/forms';
	import CoachContact from '$lib/components/layout/CoachContact.svelte';
	import {
		authCard,
		authLabel,
		authLink,
		authSubmit,
		brand,
		error,
		loginPage,
		primary,
		studio,
		success,
		requiredMark
	} from '$lib/features/cms/styles';
	let { form, data } = $props();
	let busy = $state(false);
</script>

<svelte:head
	><title>Client sign in | Configains</title><meta
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
		<h1>Sign in.</h1>
		<p>See your plan and track your progress.</p>
		{#if form?.message}<p class={error} role="alert">{form.message}</p>{/if}
		{#if data.notice === 'set'}<p class={success} role="status">
				Password saved. Sign in to start.
			</p>{/if}
		{#if data.notice === 'not-client'}<p class={error} role="alert">
				That account isn't a client account. Sign in with the email from your invitation.
			</p>{/if}
		{#if data.notice === 'updated'}<p class={success} role="status">
				Password changed. Sign in with the new one.
			</p>{/if}
		<label class={authLabel}
			><span>Email address<span class={requiredMark} aria-hidden="true">*</span></span><input
				name="email"
				type="email"
				autocomplete="username"
				required
				value={form?.email ?? ''}
			/></label
		>
		<label class={authLabel}
			><span>Password<span class={requiredMark} aria-hidden="true">*</span></span><input
				name="password"
				type="password"
				autocomplete="current-password"
				required
			/></label
		>
		<button class="{primary} {authSubmit}" disabled={busy}
			><LogIn size={18} aria-hidden="true" />{busy ? 'Signing in…' : 'Sign in'}</button
		>
		<a class={authLink} href="/forgot-password">Forgot your password?</a>
		<!-- Accounts are invite-only: say so in one glance, with the next step, and nothing else. -->
		<ul class="mt-6 mb-0 grid list-none gap-3 border-t border-line p-0 pt-5 text-[0.9rem]">
			<li class="flex items-start gap-3">
				<Mail size={20} class="mt-px shrink-0 text-cyan-deep" aria-hidden="true" />
				<span>Got an invite? Check your inbox or spam, then tap the link to set your password.</span
				>
			</li>
			<li class="flex items-start gap-3">
				<MessageCircle size={20} class="mt-px shrink-0 text-cyan-deep" aria-hidden="true" />
				<span class="grid gap-1"
					><span>No invite yet? Reach out to Cash:</span><CoachContact
						brand={data.site.brand}
						subject="Configains invite request"
					/></span
				>
			</li>
		</ul>
	</form>
</main>

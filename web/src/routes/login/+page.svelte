<script lang="ts">
	import LogIn from '@lucide/svelte/icons/log-in';
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
		<p class={eyebrow}>CLIENT SIGN IN</p>
		<h1>Sign in.</h1>
		<p>Sign in to see your plan, log your training and follow your progress.</p>
		{#if form?.message}<p class={error} role="alert">{form.message}</p>{/if}
		{#if data.notice === 'set'}<p class={success} role="status">
				Password set. Sign in to continue.
			</p>{/if}
		{#if data.notice === 'updated'}<p class={success} role="status">
				Password updated. Sign in with your new password.
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
		<p class="{help} mt-5!">
			New here? Open the invitation email from Cash and follow its link to choose your password.
			Once you have, sign in here with that email and password.
		</p>
		<a class="{authLink} mt-2!" href="/admin/login">Coach sign in</a>
	</form>
</main>

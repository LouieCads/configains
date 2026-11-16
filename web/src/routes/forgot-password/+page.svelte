<script lang="ts">
	import Mail from '@lucide/svelte/icons/mail';
	import { enhance } from '$app/forms';
	import {
		authCard,
		authLabel,
		authLink,
		authSubmit,
		brand,
		error,
		eyebrow,
		loginPage,
		primary,
		studio,
		success,
		requiredMark
	} from '$lib/features/cms/styles';
	let { data, form } = $props();
	let busy = $state(false);
</script>

<svelte:head
	><title>Forgot your password? | Configains</title><meta
		name="robots"
		content="noindex, nofollow"
	/></svelte:head
>
<main class="{studio} {loginPage}">
	<section class={authCard}>
		<a href="/" class={brand}>CONFIGAINS.</a>
		<p class={eyebrow}>CLIENT SIGN IN</p>
		<h1>Forgot your password?</h1>
		<p>
			Enter the email address you signed up with and we will send you a link to choose a new one.
		</p>
		{#if form?.sent}
			<p class={success} role="status">
				If this email has an account, a reset link will arrive shortly. Check your inbox and spam
				folder.
			</p>
		{:else}
			{#if data.expired}<p class={error} role="alert">
					Your reset link has expired. Request a new one.
				</p>{/if}
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
				{#if form?.message}<p class={error} role="alert">{form.message}</p>{/if}
				<label class={authLabel}
					><span>Email address<span class={requiredMark} aria-hidden="true">*</span></span><input
						name="email"
						type="email"
						autocomplete="email"
						maxlength="254"
						required
					/></label
				>
				<button class="{primary} {authSubmit}" disabled={busy}
					><Mail size={18} aria-hidden="true" />{busy ? 'Sending…' : 'Send reset link'}</button
				>
			</form>
		{/if}
		<a class={authLink} href="/login">Back to client sign in</a>
	</section>
</main>

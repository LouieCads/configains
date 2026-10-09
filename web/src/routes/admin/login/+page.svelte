<script lang="ts">
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
		success
	} from '$lib/features/cms/styles';
	let { form, data } = $props();
	let busy = $state(false);
</script>

<svelte:head
	><title>Admin sign in | Configains</title><meta
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
		<p class={eyebrow}>CONTENT STUDIO</p>
		<h1>Welcome back.</h1>
		<p>
			{data.localAdminDemo
				? 'Open the local content studio without credentials.'
				: 'Sign in to update your website.'}
		</p>
		{#if form?.message}<p class={error} role="alert">{form.message}</p>{/if}
		{#if data.passwordUpdated}<p class={success} role="status">
				Password updated. Sign in with your new password.
			</p>{/if}
		{#if !data.localAdminDemo}<label class={authLabel}
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
		{/if}
		<button class="{primary} {authSubmit}" disabled={busy}
			>{busy ? 'Signing in…' : 'Sign in'}</button
		>
		{#if !data.localAdminDemo}<a class={authLink} href="/admin/forgot-password"
				>Forgot your password?</a
			>{/if}
		{#if data.localAdminDemo}<p class={help}>
				Local demo: content changes stay on this device.
			</p>{/if}
	</form>
</main>

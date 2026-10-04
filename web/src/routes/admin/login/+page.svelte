<script lang="ts">
	import { enhance } from '$app/forms';
	import '$lib/features/cms/cms.css';
	let { form, data } = $props();
	let busy = $state(false);
</script>

<svelte:head
	><title>Admin sign in | Configains</title><meta
		name="robots"
		content="noindex, nofollow"
	/></svelte:head
>
<main class="cms cms-login">
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
		<a href="/" class="cms-brand">CONFIGAINS.</a>
		<p class="cms-eyebrow">CONTENT STUDIO</p>
		<h1>Welcome back.</h1>
		<p>
			{data.localAdminDemo
				? 'Open the local content studio without credentials.'
				: 'Sign in to update your website.'}
		</p>
		{#if form?.message}<p class="cms-error" role="alert">{form.message}</p>{/if}
		{#if data.passwordUpdated}<p class="cms-success" role="status">
				Password updated. Sign in with your new password.
			</p>{/if}
		{#if !data.localAdminDemo}<label
				>Email address<input
					name="email"
					type="email"
					autocomplete="username"
					required
					value={form?.email ?? ''}
				/></label
			>
			<label
				>Password<input
					name="password"
					type="password"
					autocomplete="current-password"
					required
				/></label
			>
		{/if}
		<button class="cms-primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
		{#if !data.localAdminDemo}<a class="cms-auth-link" href="/admin/forgot-password"
				>Forgot your password?</a
			>{/if}
		{#if data.localAdminDemo}<p class="editor-help">
				Local demo: content changes stay on this device.
			</p>{/if}
	</form>
</main>

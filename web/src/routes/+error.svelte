<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import House from '@lucide/svelte/icons/house';
	import LogIn from '@lucide/svelte/icons/log-in';
	import RotateCw from '@lucide/svelte/icons/rotate-cw';
	import { page } from '$app/state';
	import {
		authCard,
		authLink,
		authSubmit,
		brand,
		eyebrow,
		loginPage,
		primary,
		secondary,
		studio
	} from '$lib/features/cms/styles';

	const status = $derived(page.status);
	const inClientArea = $derived(page.url.pathname.startsWith('/app'));
	const copy = $derived(
		status === 404
			? { title: "We can't find that page.", body: 'It may have moved, or the link may be wrong.' }
			: status === 401 || status === 403
				? {
						title: "You can't open that page.",
						body: 'Sign in with your client account to continue.'
					}
				: {
						title: 'Something went wrong on our side.',
						body: 'Your plan and progress are safe. Try again in a moment.'
					}
	);
</script>

<svelte:head
	><title>{status === 404 ? 'Page not found' : 'Something went wrong'} | Configains</title><meta
		name="robots"
		content="noindex, nofollow"
	/></svelte:head
>
<main class="{studio} {loginPage}">
	<section class={authCard}>
		<a href="/" class={brand}>CONFIGAINS.</a>
		<p class={eyebrow}>ERROR {status}</p>
		<h1>{copy.title}</h1>
		<p>{copy.body}</p>
		{#if status >= 500}
			<button type="button" class="{primary} {authSubmit}" onclick={() => location.reload()}
				><RotateCw size={18} aria-hidden="true" />Try again</button
			>
		{/if}
		{#if inClientArea}
			<a class="{status >= 500 ? secondary : primary} {authSubmit}" href="/app"
				><ArrowRight size={18} aria-hidden="true" />Go to your plan</a
			>
		{:else}
			<a class="{status >= 500 ? secondary : primary} {authSubmit}" href="/"
				><House size={18} aria-hidden="true" />Go to the home page</a
			>
		{/if}
		<a class={authLink} href="/login"
			><LogIn size={16} aria-hidden="true" class="mr-1 inline" />Client sign-in</a
		>
	</section>
</main>

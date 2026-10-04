<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { publicHref } from '$lib/content/links';
	import type { Content } from '$lib/content/schema';
	let { site, preview = false }: { site: Content; preview?: boolean } = $props();
	let open = $state(false);
	let menuButton: HTMLButtonElement;
	onMount(() => {
		const observer = new ResizeObserver(() => {
			if (open && !menuButton.getClientRects().length) open = false;
		});
		observer.observe(menuButton);
		return () => observer.disconnect();
	});
	const links = $derived(
		site.navigation.items.filter(
			(item: { href: string }) =>
				!(!site.home.products.enabled && item.href.includes('#products')) &&
				!(!site.faq.enabled && item.href.includes('#faq'))
		)
	);
	function href(destination: string) {
		return page.url.pathname === '/' && destination.startsWith('/#')
			? destination.slice(1)
			: publicHref(destination, preview);
	}
</script>

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'Escape' && open) {
			open = false;
			menuButton.focus();
		}
	}}
/>
<header class="site-header">
	<div class="header-content container">
		<div class="header-inner">
			<a class="wordmark" href={publicHref('/', preview)} aria-label={site.brand.name}>
				{#if site.brand.logo}<img
						class="brand-logo"
						src={site.brand.logo}
						alt={site.brand.logoAlt}
					/>{:else}<span class="brand-symbol" aria-hidden="true">c<span>↗</span></span>{site.brand
						.wordmark}{/if}
			</a>
			<nav class="desktop-nav" aria-label="Main navigation">
				{#each links as item, index (index)}<a href={href(item.href)}>{item.label}</a>{/each}
			</nav>
			<a class="button button-dark small header-cta" href={publicHref('/contact', preview)}
				>{site.navigation.contactLabel} ↗</a
			>
			<button
				class="menu-toggle"
				bind:this={menuButton}
				aria-expanded={open}
				aria-controls="mobile-nav"
				onclick={() => {
					open = !open;
				}}
				>{open ? site.navigation.menuClose : site.navigation.menuOpen}<span aria-hidden="true"
					>{open ? '−' : '+'}</span
				></button
			>
		</div>
		<nav
			id="mobile-nav"
			class="mobile-nav"
			class:open
			aria-label="Mobile navigation"
			hidden={!open}
		>
			{#each links as item, index (index)}<a
					href={href(item.href)}
					onclick={() => {
						open = false;
					}}>{item.label}<span aria-hidden="true">↗</span></a
				>{/each}
			<a
				href={publicHref('/contact', preview)}
				onclick={() => {
					open = false;
				}}>{site.navigation.contactLabel} ↗</a
			>
		</nav>
	</div>
</header>

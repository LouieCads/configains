<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { publicHref } from '$lib/content/links';
	import type { Content } from '$lib/content/schema';
	import Arrow from '$lib/components/landing/Arrow.svelte';
	import { container, headerButton, wordmark } from '$lib/components/landing/styles';
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
	const desktopLink =
		"relative inline-flex min-h-11 items-center py-2 text-[0.9375rem] text-ink after:absolute after:inset-x-0 after:bottom-[7px] after:h-[3px] after:origin-left after:bg-cyan after:[transform:scaleX(0)] after:[transition:transform_0.3s_cubic-bezier(0.22,1,0.36,1)] after:content-[''] hover:after:[transform:scaleX(1)] aria-[current=page]:after:[transform:scaleX(1)]";
	const mobileLink =
		'flex min-h-14 items-center justify-between gap-4 border-t border-t-ink/15 py-3 font-display text-[2.25rem]/none text-ink';
	function href(destination: string) {
		return page.url.pathname === '/' && destination.startsWith('/#')
			? destination.slice(1)
			: publicHref(destination, preview);
	}
	/** Only whole-page links are "current"; hash links stay neutral. */
	function current(destination: string) {
		return !destination.includes('#') && page.url.pathname === destination.split('?')[0]
			? 'page'
			: undefined;
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
<header class="sticky top-0 z-20 border-b border-b-ink/12 bg-bone/97 [backdrop-filter:blur(14px)]">
	<div class="{container} @container">
		<div
			class="flex min-h-[84px] items-center justify-between gap-[25px] cq-58:min-h-[68px] cq-58:gap-3"
		>
			<a class={wordmark} href={publicHref('/', preview)} aria-label={site.brand.name}>
				{#if site.brand.logo}<img
						class="max-h-12 w-auto max-w-[210px] object-contain cq-58:max-h-10"
						src={site.brand.logo}
						alt={site.brand.logoAlt}
					/>{:else}{site.brand.wordmark}{/if}
			</a>
			<nav
				class="flex gap-[clamp(18px,2.4vw,34px)] font-coustard cq-58:hidden"
				aria-label="Main navigation"
			>
				{#each links as item, index (index)}<a
						class={desktopLink}
						href={href(item.href)}
						aria-current={current(item.href)}>{item.label}</a
					>{/each}
			</nav>
			<a class="{headerButton} cq-58:hidden" href={publicHref('/contact', preview)}
				>{site.navigation.contactLabel}<Arrow size={16} /></a
			>
			<button
				class="hidden min-h-11 cursor-pointer items-center gap-3 rounded-[3px] border border-ink/30 bg-transparent px-4 pt-[0.6rem] pb-[0.45rem] font-display text-[1.25rem]/none tracking-[0.09em] text-ink cq-58:flex"
				bind:this={menuButton}
				aria-expanded={open}
				aria-controls="mobile-nav"
				onclick={() => {
					open = !open;
				}}
				>{open ? site.navigation.menuClose : site.navigation.menuOpen}<span
					class="relative -mt-[0.1rem] block h-[10px] w-5"
					aria-hidden="true"
					><span
						class="absolute inset-x-0 h-[2px] bg-current [transition:transform_0.3s,top_0.3s] {open
							? 'top-[4px] rotate-45'
							: 'top-0'}"
					></span><span
						class="absolute inset-x-0 h-[2px] bg-current [transition:transform_0.3s,top_0.3s] {open
							? 'top-[4px] -rotate-45'
							: 'top-[8px]'}"
					></span></span
				></button
			>
		</div>
		<nav
			id="mobile-nav"
			class={[
				'hidden',
				open &&
					'cq-58:block cq-58:max-h-[calc(100dvh-5.5rem)] cq-58:overflow-auto cq-58:overscroll-y-contain cq-58:pb-8'
			]}
			aria-label="Mobile navigation"
			hidden={!open}
		>
			{#each links as item, index (index)}<a
					class={mobileLink}
					href={href(item.href)}
					aria-current={current(item.href)}
					onclick={() => {
						open = false;
					}}
					>{item.label}<span
						class="font-coustard text-[0.8125rem] text-cyan-deep"
						aria-hidden="true">{String(index + 1).padStart(2, '0')}</span
					></a
				>{/each}
			<a
				class="mt-6 {headerButton} w-full justify-center py-4"
				href={publicHref('/contact', preview)}
				onclick={() => {
					open = false;
				}}>{site.navigation.contactLabel}<Arrow size={16} /></a
			>
		</nav>
	</div>
</header>

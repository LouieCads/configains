<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { publicHref } from '$lib/content/links';
	import type { Content } from '$lib/content/schema';
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
		"relative inline-flex min-h-11 items-center py-2 text-[#4b5a5e] after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-left after:bg-cyan-ink after:[transform:scaleX(0)] after:[transition:transform_0.25s] after:content-[''] hover:after:[transform:scaleX(1)]";
	const mobileLink =
		'cq-58:flex cq-58:min-h-12 cq-58:items-center cq-58:justify-between cq-58:gap-4 cq-58:border-t cq-58:border-t-line cq-58:py-[14px] cq-58:font-[Arial] cq-58:text-[0.9375rem] cq-58:leading-[normal] cq-58:font-normal';
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
<header
	class="sticky top-0 z-10 border-b border-b-[#dce5e299] bg-[#f9faf7f5] bg-(image:--image-floor-grain) bg-size-[192px_192px] [backdrop-filter:blur(16px)]"
>
	<div class="{container} @container">
		<div
			class="flex min-h-[90px] items-center justify-between gap-[25px] bp-850:min-h-[76px] bp-640:min-h-[72px] cq-58:min-h-[76px] cq-58:flex-wrap cq-58:gap-3 cq-58:py-3"
		>
			<a class={wordmark} href={publicHref('/', preview)} aria-label={site.brand.name}>
				{#if site.brand.logo}<img
						class="max-h-12 w-auto max-w-[210px] object-contain"
						src={site.brand.logo}
						alt={site.brand.logoAlt}
					/>{:else}<span
						class="relative mr-[10px] grid size-8 place-items-center font-['Bebas_Neue',sans-serif] text-[32px] leading-[0.8] uppercase bp-1100:hidden bp-850:grid cq-58:grid"
						aria-hidden="true"
						>c<span class="absolute top-1 right-[3px] font-[Arial] text-[16px] leading-[normal]"
							>↗</span
						></span
					>{site.brand.wordmark}{/if}
			</a>
			<nav
				class="flex gap-[25px] font-arial text-[0.875rem]/[1.5] bp-1100:gap-[17px] bp-1100:text-[0.8125rem] bp-850:hidden cq-58:hidden"
				aria-label="Main navigation"
			>
				{#each links as item, index (index)}<a class={desktopLink} href={href(item.href)}
						>{item.label}</a
					>{/each}
			</nav>
			<a class="{headerButton} bp-850:hidden cq-58:hidden" href={publicHref('/contact', preview)}
				>{site.navigation.contactLabel} ↗</a
			>
			<button
				class="hidden cq-58:flex cq-58:min-h-11 cq-58:items-center cq-58:gap-[18px] cq-58:rounded-[7px] cq-58:border cq-58:border-[#cfddd6] cq-58:bg-transparent cq-58:px-[14px] cq-58:py-[10px] cq-58:font-[Arial] cq-58:text-[0.875rem] cq-58:leading-[normal] cq-58:font-normal cq-58:text-ink"
				bind:this={menuButton}
				aria-expanded={open}
				aria-controls="mobile-nav"
				onclick={() => {
					open = !open;
				}}
				>{open ? site.navigation.menuClose : site.navigation.menuOpen}<span
					class="bp-850:text-[1.125rem]"
					aria-hidden="true">{open ? '−' : '+'}</span
				></button
			>
		</div>
		<nav
			id="mobile-nav"
			class={[
				'hidden',
				open &&
					'cq-58:block cq-58:max-h-[calc(100dvh-6rem)] cq-58:overflow-auto cq-58:overscroll-y-contain cq-58:pb-5'
			]}
			aria-label="Mobile navigation"
			hidden={!open}
		>
			{#each links as item, index (index)}<a
					class={mobileLink}
					href={href(item.href)}
					onclick={() => {
						open = false;
					}}>{item.label}<span aria-hidden="true">↗</span></a
				>{/each}
			<a
				class={mobileLink}
				href={publicHref('/contact', preview)}
				onclick={() => {
					open = false;
				}}>{site.navigation.contactLabel} ↗</a
			>
		</nav>
	</div>
</header>

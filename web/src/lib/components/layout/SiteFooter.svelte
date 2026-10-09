<script lang="ts">
	import { publicHref } from '$lib/content/links';
	import type { Content } from '$lib/content/schema';
	import { container, textLink, wordmark } from '$lib/components/landing/styles';
	let { site, preview = false }: { site: Content; preview?: boolean } = $props();
	const link = 'inline-flex min-h-11 items-center hover:text-cyan-ink';
</script>

<footer class="border-t border-t-line">
	<div
		class="{container} flex items-center justify-between gap-[25px] py-10 bp-640:flex-wrap bp-640:gap-6 bp-640:py-[30px]"
	>
		<a class={wordmark} href={publicHref('/', preview)}>{site.brand.wordmark}</a>
		<p class="text-[0.875rem] bp-640:order-3 bp-640:w-full bp-640:text-[0.8125rem]">
			{site.brand.tagline}
		</p>
		<a class={textLink} href="#main-content">{site.navigation.backToTop} ↑</a>
	</div>
	<div
		class="{container} flex items-center justify-between gap-[25px] border-t border-t-line py-[25px] font-[Arial] text-[0.75rem]/[1.5] text-muted bp-850:flex-wrap bp-640:flex-col bp-640:items-start bp-640:gap-[19px] bp-640:py-[23px]"
	>
		<span>© {new Date().getFullYear()} {site.brand.name}</span>
		<nav class="flex flex-wrap gap-[22px] bp-640:gap-4" aria-label="Footer navigation">
			{#each site.navigation.items as item, index (index)}{#if !(item.href.includes('#products') && !site.home.products.enabled) && !(item.href.includes('#faq') && !site.faq.enabled)}<a
						class={link}
						href={publicHref(item.href, preview)}>{item.label}</a
					>{/if}{/each}
			<a class={link} href={publicHref('/contact', preview)}>{site.navigation.contactLink}</a>
			{#if site.home.app.enabled && site.home.app.ready}<a
					class={link}
					href={site.home.app.url}
					target="_blank"
					rel="noopener noreferrer">{site.navigation.appLink} ↗</a
				>{/if}
			{#each site.brand.socialLinks as item, index (index)}<a
					class={link}
					href={item.href}
					target="_blank"
					rel="noopener noreferrer">{item.label} ↗</a
				>{/each}
		</nav>
		<span class="bp-850:hidden">{site.navigation.footerNote}</span>
	</div>
</footer>

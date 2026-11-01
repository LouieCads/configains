<script lang="ts">
	import { publicHref } from '$lib/content/links';
	import type { Content } from '$lib/content/schema';
	import { container } from '$lib/components/landing/styles';
	let { site, preview = false }: { site: Content; preview?: boolean } = $props();
	const link =
		'inline-flex min-h-11 items-center text-[0.9375rem] text-[#d3e1e3] [transition:color_0.2s] hover:text-cyan';
</script>

<footer class="bg-night text-[#b6cdd1]">
	<div
		class="{container} grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-12 gap-y-12 pt-[clamp(56px,7vw,96px)] pb-14 bp-480:grid-cols-[minmax(0,1fr)] cq-52:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] cq-52:gap-y-10"
	>
		<div class="bp-480:col-span-1 cq-52:col-span-2">
			<a
				class="block font-display text-[clamp(3.5rem,8vw,6.5rem)]/[0.9] text-bone [transition:color_0.2s] hover:text-cyan"
				href={publicHref('/', preview)}>{site.brand.wordmark}</a
			>
			<p class="mt-4 max-w-[26rem] text-[1rem] text-[#b6cdd1]">{site.brand.tagline}</p>
		</div>
		<nav aria-label="Footer navigation">
			<ul class="m-0 list-none p-0">
				{#each site.navigation.items as item, index (index)}{#if !(item.href.includes('#products') && !site.home.products.enabled) && !(item.href.includes('#faq') && !site.faq.enabled)}<li
						>
							<a class={link} href={publicHref(item.href, preview)}>{item.label}</a>
						</li>{/if}{/each}
				<li>
					<a class={link} href={publicHref('/contact', preview)}>{site.navigation.contactLink}</a>
				</li>
			</ul>
		</nav>
		{#if (site.home.app.enabled && site.home.app.ready) || site.brand.socialLinks.length}<div>
				<ul class="m-0 list-none p-0">
					{#if site.home.app.enabled && site.home.app.ready}<li>
							<a class={link} href={site.home.app.url} target="_blank" rel="noopener noreferrer"
								>{site.navigation.appLink}<span class="sr-only"> (opens in a new tab)</span></a
							>
						</li>{/if}
					{#each site.brand.socialLinks as item, index (index)}<li>
							<a class={link} href={item.href} target="_blank" rel="noopener noreferrer"
								>{item.label}<span class="sr-only"> (opens in a new tab)</span></a
							>
						</li>{/each}
				</ul>
			</div>{/if}
	</div>
	<div class="border-t border-t-white/12">
		<div
			class="{container} flex flex-wrap items-center justify-between gap-x-8 gap-y-2 py-6 text-[0.8125rem]/[1.5] text-[#9fb8bd]"
		>
			<span>© {new Date().getFullYear()} {site.brand.name}</span>
			<span class="bp-640:order-3 bp-640:w-full">{site.navigation.footerNote}</span>
			<a class="{link} text-[0.8125rem]" href="#main-content">{site.navigation.backToTop}</a>
		</div>
	</div>
</footer>

<script lang="ts">
	import { publicHref } from '$lib/content/links';
	import type { Content } from '$lib/content/schema';
	let { site, preview = false }: { site: Content; preview?: boolean } = $props();
</script>

<footer class="landing-footer">
	<div class="footer-top container">
		<a class="wordmark" href={publicHref('/', preview)}>{site.brand.wordmark}</a>
		<p>{site.brand.tagline}</p>
		<a class="text-link" href="#main-content">{site.navigation.backToTop} ↑</a>
	</div>
	<div class="footer-bottom container">
		<span>© {new Date().getFullYear()} {site.brand.name}</span>
		<nav aria-label="Footer navigation">
			{#each site.navigation.items as item, index (index)}{#if !(item.href.includes('#products') && !site.home.products.enabled) && !(item.href.includes('#faq') && !site.faq.enabled)}<a
						href={publicHref(item.href, preview)}>{item.label}</a
					>{/if}{/each}
			<a href={publicHref('/contact', preview)}>{site.navigation.contactLink}</a>
			{#if site.home.app.enabled && site.home.app.ready}<a
					href={site.home.app.url}
					target="_blank"
					rel="noopener noreferrer">{site.navigation.appLink} ↗</a
				>{/if}
			{#each site.brand.socialLinks as item, index (index)}<a
					href={item.href}
					target="_blank"
					rel="noopener noreferrer">{item.label} ↗</a
				>{/each}
		</nav>
		<span>{site.navigation.footerNote}</span>
	</div>
</footer>

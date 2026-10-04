<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import SiteFooter from '$lib/components/layout/SiteFooter.svelte';
	import SiteHeader from '$lib/components/layout/SiteHeader.svelte';
	import PreviewBanner from '$lib/components/layout/PreviewBanner.svelte';
	import '$lib/components/landing/landing.css';
	let { children, data } = $props();
</script>

<SEO site={data.site} origin={data.siteOrigin} preview={data.preview} />
<div class="landing" id="home">
	<a class="skip-link" href="#main-content">{data.site.navigation.skipLabel}</a>
	{#if data.preview}<PreviewBanner />{/if}
	<SiteHeader site={data.site} preview={data.preview} />
	<main id="main-content">{@render children()}</main>
	<SiteFooter site={data.site} preview={data.preview} />
</div>

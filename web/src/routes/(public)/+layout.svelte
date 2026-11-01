<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import SiteFooter from '$lib/components/layout/SiteFooter.svelte';
	import SiteHeader from '$lib/components/layout/SiteHeader.svelte';
	import PreviewBanner from '$lib/components/layout/PreviewBanner.svelte';
	import { root } from '$lib/components/landing/styles';
	let { children, data } = $props();
</script>

<SEO site={data.site} origin={data.siteOrigin} preview={data.preview} />
<div class={root} id="home">
	<a
		class="absolute -top-[100px] left-5 z-50 rounded-[3px] bg-cyan px-5 pt-3 pb-2 font-display text-[1.25rem]/none tracking-[0.09em] text-ink focus:top-3"
		href="#main-content">{data.site.navigation.skipLabel}</a
	>
	{#if data.preview}<PreviewBanner />{/if}
	<SiteHeader site={data.site} preview={data.preview} />
	<main id="main-content">{@render children()}</main>
	<SiteFooter site={data.site} preview={data.preview} />
</div>

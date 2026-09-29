<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import SiteFooter from '$lib/components/layout/SiteFooter.svelte';
	import SiteHeader from '$lib/components/layout/SiteHeader.svelte';
	let { children } = $props();
</script>

{#if page.url.pathname.replace(/\/+$/, '') === base}
	{@render children()}
{:else}
	<SiteHeader />
	<main>{@render children()}</main>
	<SiteFooter />
{/if}

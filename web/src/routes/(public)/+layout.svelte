<script lang="ts">
	import SiteFooter from '$lib/components/layout/SiteFooter.svelte';
	import SiteHeader from '$lib/components/layout/SiteHeader.svelte';
	let { children } = $props();
</script>

<SiteHeader />
<main>{@render children()}</main>
<SiteFooter />

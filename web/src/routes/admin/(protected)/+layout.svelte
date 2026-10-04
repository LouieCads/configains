<script lang="ts">
	import AdminShell from '$lib/components/layout/AdminShell.svelte';
	let { data, children } = $props();
</script>

<svelte:head><meta name="robots" content="noindex, nofollow" /></svelte:head>

<AdminShell email={data.user.email ?? 'Administrator'} localDemo={data.localAdminDemo}
	>{@render children()}</AdminShell
>

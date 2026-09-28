<script lang="ts">
	import AdminShell from '$lib/components/layout/AdminShell.svelte';
	let { data, children } = $props();
</script>

<AdminShell email={data.user.email ?? 'Administrator'}>{@render children()}</AdminShell>

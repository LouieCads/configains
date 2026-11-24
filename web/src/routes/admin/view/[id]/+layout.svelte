<script lang="ts">
	import ClientPreviewBar from '$lib/components/layout/ClientPreviewBar.svelte';
	let { data, children } = $props();
</script>

<ClientPreviewBar clientId={data.client.id} name={data.client.display_name} />
{@render children()}

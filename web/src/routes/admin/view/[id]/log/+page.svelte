<script lang="ts">
	import ClientLog from '$lib/features/client/ClientLog.svelte';
	let { data } = $props();
</script>

<ClientLog {data} base={data.base} preview />

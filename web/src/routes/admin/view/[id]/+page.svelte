<script lang="ts">
	import ClientHome from '$lib/features/client/ClientHome.svelte';
	let { data } = $props();
</script>

<ClientHome {data} base={data.base} />

<script lang="ts">
	import ClientProgress from '$lib/features/client/ClientProgress.svelte';
	let { data } = $props();
</script>

<ClientProgress {data} />

<script lang="ts">
	import ClientCoach from '$lib/features/client/ClientCoach.svelte';
	let { data } = $props();
</script>

<ClientCoach {data} base={data.base} preview />

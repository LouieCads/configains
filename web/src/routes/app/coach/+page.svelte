<script lang="ts">
	import ClientCoach from '$lib/features/client/ClientCoach.svelte';
	let { data, form } = $props();
</script>

<ClientCoach {data} {form} />

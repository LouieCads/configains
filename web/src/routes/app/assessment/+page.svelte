<script lang="ts">
	import ClientAssessment from '$lib/features/client/ClientAssessment.svelte';
	let { form } = $props();
</script>

<ClientAssessment {form} />

<script lang="ts">
	import CollectionManager from '$lib/features/cms/CollectionManager.svelte';
	let { data } = $props();
</script>

<svelte:head><title>Transformations | Configains CMS</title></svelte:head>
<h1>Transformations</h1>
<CollectionManager collection="transformations" rows={data.rows} />

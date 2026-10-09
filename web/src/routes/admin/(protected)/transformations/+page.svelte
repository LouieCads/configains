<script lang="ts">
	import CollectionManager from '$lib/features/cms/CollectionManager.svelte';
	import { help } from '$lib/features/cms/styles';
	let { data } = $props();
</script>

<svelte:head><title>Transformations | Configains CMS</title></svelte:head>
<h1>Transformations</h1>
<p class={help}>
	Each published entry is one before-and-after slide on the homepage and Transformations page. Use
	Sort order (lowest first) to arrange slides, and uncheck Published to hide one.
</p>
<CollectionManager collection="transformations" rows={data.rows} />

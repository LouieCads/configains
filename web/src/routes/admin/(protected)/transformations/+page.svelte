<script lang="ts">
	import CollectionManager from '$lib/features/cms/CollectionManager.svelte';
	let { data } = $props();
</script>

<svelte:head><title>Transformations | Configains CMS</title></svelte:head>
<h1 class="mb-8 text-4xl font-black">Transformations</h1>
<p class="editor-help">
	Each published entry becomes one before-and-after slide on the homepage and Transformations page.
	Add as many entries as you need, use Sort order to arrange them (lowest first), and uncheck
	Published to take a slide out of the carousel.
</p>
<CollectionManager collection="transformations" rows={data.rows} />

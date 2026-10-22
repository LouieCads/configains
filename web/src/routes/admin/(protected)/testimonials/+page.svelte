<script lang="ts">
	import CollectionManager from '$lib/features/cms/CollectionManager.svelte';
	import { help } from '$lib/features/cms/styles';
	let { data } = $props();
</script>

<svelte:head><title>Testimonials | Configains CMS</title></svelte:head>
<h1>Testimonials</h1>
<p class={help}>
	Each published entry is a client quote with one photo. For before-and-after photos, use
	<a href="/admin/transformations">Transformations</a>.
</p>
<CollectionManager collection="testimonials" rows={data.rows} />

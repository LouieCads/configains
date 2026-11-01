<script lang="ts">
	import CollectionManager from '$lib/features/cms/CollectionManager.svelte';
	import { help } from '$lib/features/cms/styles';
	let { data } = $props();
</script>

<svelte:head><title>Testimonials | Configains CMS</title></svelte:head>
<h1>Testimonials</h1>
<p class={help}>Client quotes with one photo.</p>
<CollectionManager collection="testimonials" rows={data.rows} />

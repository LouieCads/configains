<script lang="ts">
	import CollectionManager from '$lib/features/cms/CollectionManager.svelte';
	let { data } = $props();
</script>

<svelte:head><title>Testimonials | Configains CMS</title></svelte:head>
<h1 class="mb-8 text-4xl font-black">Testimonials</h1>
<CollectionManager collection="testimonials" rows={data.rows} />

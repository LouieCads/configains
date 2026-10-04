<script lang="ts">
	import CollectionManager from '$lib/features/cms/CollectionManager.svelte';
	let { data } = $props();
	const fields = [
		{ name: 'title', label: 'Title' },
		{ name: 'summary', label: 'Summary', type: 'textarea' },
		{ name: 'story', label: 'Full story', type: 'textarea' },
		{ name: 'before_image_url', label: 'Before photo', type: 'image' },
		{ name: 'before_image_alt', label: 'Before photo description' },
		{ name: 'after_image_url', label: 'After photo', type: 'image' },
		{ name: 'after_image_alt', label: 'After photo description' },
		{ name: 'sort_order', label: 'Sort order', type: 'number' },
		{ name: 'is_published', label: 'Published', type: 'checkbox' }
	] as const;
</script>

<svelte:head><title>Transformations | Configains CMS</title></svelte:head>
<h1 class="mb-8 text-4xl font-black">Transformations</h1>
<CollectionManager collection="transformations" rows={data.rows} fields={[...fields]} />

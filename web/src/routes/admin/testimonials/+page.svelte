<script lang="ts">
	import CollectionManager from '$lib/features/cms/CollectionManager.svelte';
	let { data } = $props();
	const fields = [
		{ name: 'name', label: 'Client name' },
		{ name: 'role', label: 'Role or result' },
		{ name: 'quote', label: 'Quote', type: 'textarea' },
		{ name: 'image_url', label: 'Image URL' },
		{ name: 'sort_order', label: 'Sort order', type: 'number' },
		{ name: 'is_published', label: 'Published', type: 'checkbox' }
	] as const;
</script>

<svelte:head><title>Testimonials | Configains CMS</title></svelte:head>
<h1 class="mb-8 text-4xl font-black">Testimonials</h1>
<CollectionManager collection="testimonials" rows={data.rows} fields={[...fields]} />

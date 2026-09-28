<script lang="ts">
	import CollectionManager from '$lib/features/cms/CollectionManager.svelte';
	let { data } = $props();
	const fields = [
		{ name: 'key', label: 'Content key' },
		{ name: 'title', label: 'Title' },
		{ name: 'body', label: 'Body', type: 'textarea' }
	] as const;
</script>

<svelte:head><title>Content | Configains CMS</title></svelte:head>
<h1 class="mb-8 text-4xl font-black">Site content</h1>
<CollectionManager collection="site_content" rows={data.rows} fields={[...fields]} />

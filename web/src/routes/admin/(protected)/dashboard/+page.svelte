<script lang="ts">
	import { card, eyebrow, primary } from '$lib/features/cms/styles';
	let { data } = $props();
</script>

<svelte:head><title>Dashboard | Configains CMS</title></svelte:head>
<div class="mb-7 max-w-[800px]">
	<p class={eyebrow}>CONTENT STUDIO</p>
	<h1>Keep your site moving.</h1>
	<p class="text-muted">Update your pages, upload approved images, and publish at your pace.</p>
</div>
<a class={primary} href="/admin/content">Edit website →</a>
<div class="my-7 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-[18px]">
	{#each Object.entries(data.counts) as [label, count] (label)}<article class={card}>
			<span>{label}</span><strong class="block text-[2.5rem]">{count}</strong>
		</article>{/each}
</div>
<article class={card}>
	<h2>A simple publishing flow.</h2>
	<p>
		Choose a website section, make your changes, and save a draft. Use Preview saved draft to check
		it, then Publish website when you are ready. Approved client stories can be managed separately.
	</p>
</article>

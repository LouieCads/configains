<script lang="ts">
	let { data } = $props();
</script>

<svelte:head><title>Dashboard | Configains CMS</title></svelte:head>
<div class="cms-page-heading">
	<p class="cms-eyebrow">CONTENT STUDIO</p>
	<h1>Keep your site moving.</h1>
	<p>Update your pages, upload approved images, and publish at your pace.</p>
</div>
<a class="cms-primary" href="/admin/content">Edit website →</a>
<div class="cms-stats">
	{#each Object.entries(data.counts) as [label, count] (label)}<article class="cms-card">
			<span>{label}</span><strong>{count}</strong>
		</article>{/each}
</div>
<article class="cms-card">
	<h2>A simple publishing flow.</h2>
	<p>
		Choose a website section, make your changes, and save a draft. Use Preview saved draft to check
		it, then Publish website when you are ready. Approved client stories can be managed separately.
	</p>
</article>

<script lang="ts">
	import PageHero from '$lib/components/sections/PageHero.svelte';
	import TransformationCarousel from '$lib/components/sections/TransformationCarousel.svelte';
	let { data } = $props();
	const c = $derived(data.site.transformations),
		proof = $derived(data.site.home.proof);
</script>

<PageHero {...c.hero} />
<section class="section container">
	{#if data.transformations.length}<TransformationCarousel
			items={data.transformations}
			{proof}
			showStory
		/>
	{:else}<p class="empty-message">{c.empty}</p>{/if}
</section>

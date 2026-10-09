<script lang="ts">
	import PageHero from '$lib/components/sections/PageHero.svelte';
	import TransformationCarousel from '$lib/components/sections/TransformationCarousel.svelte';
	import { container, section } from '$lib/components/landing/styles';
	let { data } = $props();
	const c = $derived(data.site.transformations),
		proof = $derived(data.site.home.proof);
</script>

<PageHero {...c.hero} />
<section class="{section} {container}">
	{#if data.transformations.length}<TransformationCarousel
			items={data.transformations}
			{proof}
			showStory
		/>
	{:else}<p class="rounded-lg border border-line bg-paper p-8">{c.empty}</p>{/if}
</section>

<script lang="ts">
	import PageHero from '$lib/components/sections/PageHero.svelte';
	import TransformationCarousel from '$lib/components/sections/TransformationCarousel.svelte';
	import { container, section } from '$lib/components/landing/styles';
	let { data } = $props();
	const c = $derived(data.site.transformations),
		proof = $derived(data.site.home.proof);
</script>

<PageHero {...c.hero} />
<section class={section}>
	<div class={container}>
		{#if data.transformations.length}<TransformationCarousel
				items={data.transformations}
				{proof}
				showStory
			/>
		{:else}<p class="border-l-4 border-l-cyan bg-mist p-8 text-ink">{c.empty}</p>{/if}
	</div>
</section>

<script lang="ts">
	import PageHero from '$lib/components/sections/PageHero.svelte';
	import { publicHref } from '$lib/content/links';
	let { data } = $props();
	const c = $derived(data.site.about);
</script>

<PageHero {...c.hero} />
<section class="section page-copy container">
	{#if data.site.brand.portrait}<img
			class="about-portrait"
			src={data.site.brand.portrait}
			alt={data.site.brand.portraitAlt}
		/>{/if}
	{#each c.sections as section, index (index)}<article>
			<h2>{section.heading}</h2>
			<p class="pre-line">{section.body}</p>
		</article>{/each}
	<a class="button" href={publicHref('/contact', data.preview)}>{c.cta} ↗</a>
</section>

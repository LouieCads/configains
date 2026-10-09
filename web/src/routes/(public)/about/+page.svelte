<script lang="ts">
	import PageHero from '$lib/components/sections/PageHero.svelte';
	import { publicHref } from '$lib/content/links';
	import {
		button,
		pageCopy,
		pageCopyText,
		section as sectionSpacing
	} from '$lib/components/landing/styles';
	let { data } = $props();
	const c = $derived(data.site.about);
</script>

<PageHero {...c.hero} />
<section class="{sectionSpacing} {pageCopy}">
	{#if data.site.brand.portrait}<img
			class="mb-9 w-full max-w-[380px] rounded-xl"
			src={data.site.brand.portrait}
			alt={data.site.brand.portraitAlt}
		/>{/if}
	{#each c.sections as section, index (index)}<article class="mb-10">
			<h2>{section.heading}</h2>
			<p class="{pageCopyText} whitespace-pre-line">{section.body}</p>
		</article>{/each}
	<a class={button} href={publicHref('/contact', data.preview)}>{c.cta} ↗</a>
</section>

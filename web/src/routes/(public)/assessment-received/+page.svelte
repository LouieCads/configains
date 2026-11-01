<script lang="ts">
	import Arrow from '$lib/components/landing/Arrow.svelte';
	import SectionLabel from '$lib/components/landing/SectionLabel.svelte';
	import { button, pageCopy, section as sectionSpacing } from '$lib/components/landing/styles';
	let { data } = $props();
	const c = $derived(data.site.contact);
</script>

<section class="{sectionSpacing} {pageCopy}">
	<SectionLabel>{c.successEyebrow}</SectionLabel>
	<h1>{c.successTitle}</h1>
	<p class="mt-6 mb-10 text-[1.125rem]">{c.successCopy}</p>
	<a class={button} href="/">{c.back}<Arrow /></a>
</section>

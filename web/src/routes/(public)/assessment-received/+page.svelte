<script lang="ts">
	import {
		button,
		eyebrowText,
		pageCopy,
		pageCopyText,
		section as sectionSpacing
	} from '$lib/components/landing/styles';
	let { data } = $props();
	const c = $derived(data.site.contact);
</script>

<section class="{sectionSpacing} {pageCopy}">
	<p class="{eyebrowText} {pageCopyText} text-muted">{c.successEyebrow}</p>
	<h1>{c.successTitle}</h1>
	<p class={pageCopyText}>{c.successCopy}</p>
	<a class={button} href="/">{c.back} →</a>
</section>

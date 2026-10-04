<script lang="ts">
	import PageHero from '$lib/components/sections/PageHero.svelte';
	import { publicHref } from '$lib/content/links';
	let { data } = $props();
	const c = $derived(data.site.coaching);
</script>

<PageHero {...c.hero} />
<section class="section container">
	<div class="service-grid">
		{#each data.site.services as service, index (index)}<article class="service-card">
				<p class="eyebrow">{String(index + 1).padStart(2, '0')}</p>
				<h2>{service.title}</h2>
				<p>{service.copy}</p>
				<div class="service-detail">✓ {service.detail}</div>
			</article>{/each}
	</div>
</section>
<section class="page-copy section container">
	<h2>{c.closingTitle}</h2>
	<p class="pre-line">{c.closingCopy}</p>
	<a class="button" href={publicHref('/contact', data.preview)}>{c.cta} ↗</a>
</section>

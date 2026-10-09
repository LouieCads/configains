<script lang="ts">
	import PageHero from '$lib/components/sections/PageHero.svelte';
	import { publicHref } from '$lib/content/links';
	import {
		button,
		container,
		pageCopy,
		pageCopyText,
		section,
		serviceCard,
		serviceCopy,
		serviceDetail,
		serviceGrid
	} from '$lib/components/landing/styles';
	let { data } = $props();
	const c = $derived(data.site.coaching);
</script>

<PageHero {...c.hero} />
<section class="{section} {container}">
	<div class={serviceGrid}>
		{#each data.site.services as service, index (index)}<article class={serviceCard}>
				<p
					class="mt-4 mb-[26px] flex items-center gap-3 font-arial text-[0.9375rem] leading-[1.9] font-semibold tracking-[1.6px] text-muted bp-850:max-w-[620px] bp-850:text-[1rem] bp-850:tracking-[1.1px] bp-640:mb-[23px] bp-640:text-[0.9375rem] bp-640:tracking-[1.2px]"
				>
					{String(index + 1).padStart(2, '0')}
				</p>
				<h2 class="text-[2rem]">{service.title}</h2>
				<p class={serviceCopy}>{service.copy}</p>
				<div class={serviceDetail}>✓ {service.detail}</div>
			</article>{/each}
	</div>
</section>
<section class="{pageCopy} {section}">
	<h2>{c.closingTitle}</h2>
	<p class="{pageCopyText} whitespace-pre-line">{c.closingCopy}</p>
	<a class={button} href={publicHref('/contact', data.preview)}>{c.cta} ↗</a>
</section>

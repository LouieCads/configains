<script lang="ts">
	import Arrow from '$lib/components/landing/Arrow.svelte';
	import PageHero from '$lib/components/sections/PageHero.svelte';
	import ServiceRows from '$lib/components/landing/ServiceRows.svelte';
	import { reveal } from '$lib/components/landing/motion';
	import { publicHref } from '$lib/content/links';
	import { buttonOnDark, container, section } from '$lib/components/landing/styles';
	let { data } = $props();
	const c = $derived(data.site.coaching);
</script>

<PageHero {...c.hero} />
<section class={section}>
	<div class={container}>
		<ServiceRows services={data.site.services} headingTag="h2" wide />
	</div>
</section>
<section class="bg-night text-bone">
	<div
		class="{container} grid grid-cols-[minmax(0,7fr)_minmax(0,4fr)] items-end gap-x-16 gap-y-10 py-[clamp(64px,8vw,112px)] cq-58:grid-cols-[minmax(0,1fr)]"
	>
		<h2 class="text-bone" use:reveal>{c.closingTitle}</h2>
		<div use:reveal={100}>
			<p class="max-w-[26rem] text-[1.0625rem] whitespace-pre-line text-[#b6cdd1]">
				{c.closingCopy}
			</p>
			<a class="{buttonOnDark} mt-8" href={publicHref('/contact', data.preview)}>{c.cta}<Arrow /></a
			>
		</div>
	</div>
</section>

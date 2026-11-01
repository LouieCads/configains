<script lang="ts">
	import Arrow from '$lib/components/landing/Arrow.svelte';
	import PageHero from '$lib/components/sections/PageHero.svelte';
	import { reveal } from '$lib/components/landing/motion';
	import { publicHref } from '$lib/content/links';
	import { button, container, section as sectionSpacing } from '$lib/components/landing/styles';
	let { data } = $props();
	const c = $derived(data.site.about);
</script>

<PageHero {...c.hero} />
<section class={sectionSpacing}>
	<div
		class="{container} grid items-start gap-x-[clamp(40px,6vw,96px)] gap-y-14 {data.site.brand
			.portrait
			? 'grid-cols-[minmax(0,4fr)_minmax(0,7fr)] cq-58:grid-cols-[minmax(0,1fr)]'
			: 'grid-cols-[minmax(0,1fr)]'}"
	>
		{#if data.site.brand.portrait}<figure
				class="relative sticky top-28 isolate m-0 cq-58:static cq-58:max-w-[26rem]"
				use:reveal
			>
				<div
					class="absolute inset-0 -z-10 translate-x-4 translate-y-4 bg-cyan"
					aria-hidden="true"
				></div>
				<img
					class="aspect-[4/5] w-full rounded-[3px] object-cover"
					src={data.site.brand.portrait}
					alt={data.site.brand.portraitAlt}
				/>
			</figure>{/if}
		<div class="max-w-[780px]">
			{#each c.sections as section, index (index)}<article
					class="not-first:mt-12 not-first:border-t not-first:border-t-ink/20 not-first:pt-12"
					use:reveal
				>
					<h2 class="text-[clamp(2.25rem,3.8vw,3.25rem)]">{section.heading}</h2>
					<p class="mt-5 text-[1.0625rem] whitespace-pre-line">{section.body}</p>
				</article>{/each}
			<div class="mt-14">
				<a class={button} href={publicHref('/contact', data.preview)}>{c.cta}<Arrow /></a>
			</div>
		</div>
	</div>
</section>

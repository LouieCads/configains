<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Content } from '$lib/content/schema';
	import { publicHref } from '$lib/content/links';
	import { reveal } from './motion';
	import {
		anchor,
		container,
		eyebrow,
		section,
		sectionHeading,
		sectionNumber,
		serviceCard,
		serviceCopy,
		serviceDetail,
		serviceGrid,
		textLink
	} from './styles';
	let {
		services,
		content,
		icon,
		preview = false,
		number = '02'
	}: {
		services: Content[];
		content: Content;
		icon: Snippet<[string]>;
		preview?: boolean;
		number?: string;
	} = $props();
</script>

<section id="coaching" class="{section} {anchor} bg-transparent" aria-labelledby="coaching-title">
	<div class={container}>
		<div class={sectionHeading} use:reveal>
			<div>
				<p class={eyebrow}><span class={sectionNumber}>{number}</span>{content.eyebrow}</p>
				<h2 id="coaching-title">
					{content.heading.first}<br /><span class="text-cyan-ink">{content.heading.accent}</span>
				</h2>
			</div>
		</div>
		<div class={serviceGrid}>
			{#each services as service, index (index)}<article
					class={serviceCard}
					use:reveal={index * 70}
				>
					<div
						class="mb-[29px] flex items-center justify-between font-[Arial] text-[0.75rem] leading-[normal] text-[#778989] bp-850:mb-5"
					>
						<span class="grid size-8 place-items-center text-cyan-ink"
							>{@render icon(service.icon)}</span
						><span>{String(index + 1).padStart(2, '0')} /</span>
					</div>
					<h3>{service.title}</h3>
					<p class={serviceCopy}>{service.copy}</p>
					<div class={serviceDetail}>
						<span
							class="font-[Arial] text-[0.875rem] leading-[normal] text-cyan-ink"
							aria-hidden="true">✓</span
						>{service.detail}
					</div>
				</article>{/each}
		</div>
		<div
			class="mt-[29px] flex items-center justify-end gap-[25px] bp-850:flex-col bp-850:items-end bp-850:gap-[15px]"
		>
			<a class={textLink} href={publicHref('/contact', preview)}>{content.cta} ↗</a>
		</div>
	</div>
</section>

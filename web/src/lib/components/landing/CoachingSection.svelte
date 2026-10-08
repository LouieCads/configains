<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Content } from '$lib/content/schema';
	import { publicHref } from '$lib/content/links';
	import { reveal } from './motion';
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

<section id="coaching" class="coaching-section section" aria-labelledby="coaching-title">
	<div class="container">
		<div class="section-heading" use:reveal>
			<div>
				<p class="eyebrow"><span class="section-number">{number}</span>{content.eyebrow}</p>
				<h2 id="coaching-title">
					{content.heading.first}<br /><span class="cyan-text">{content.heading.accent}</span>
				</h2>
			</div>
		</div>
		<div class="service-grid">
			{#each services as service, index (index)}<article
					class="service-card"
					use:reveal={index * 70}
				>
					<div class="service-top">
						<span class="service-icon">{@render icon(service.icon)}</span><span
							>{String(index + 1).padStart(2, '0')} /</span
						>
					</div>
					<h3>{service.title}</h3>
					<p>{service.copy}</p>
					<div class="service-detail">
						<span class="check" aria-hidden="true">✓</span>{service.detail}
					</div>
				</article>{/each}
		</div>
		<div class="coaching-bottom">
			<a class="text-link" href={publicHref('/contact', preview)}>{content.cta} ↗</a>
		</div>
	</div>
</section>

<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';
	import { reveal } from './motion';
	type Service = { number: string; title: string; copy: string; detail: string; icon: string };
	let { services, icon }: { services: Service[]; icon: Snippet<[string]> } = $props();
</script>

<section id="coaching" class="coaching-section section" aria-labelledby="coaching-title">
	<div class="container">
		<div class="section-heading" use:reveal>
			<div>
				<p class="eyebrow"><span class="section-number">02</span> CONFIGAINS COACHING</p>
				<h2 id="coaching-title">
					LESS GUESSWORK.<br />MORE <span class="cyan-text">DIRECTION.</span>
				</h2>
				<p>
					Your starting point shapes your program. Cash Fuerte guides the training, nutrition, and
					next steps.
				</p>
			</div>
		</div>
		<div class="service-grid">
			{#each services as service, i (service.number)}
				<article
					class="service-card"
					use:reveal={i * 70}
					aria-labelledby={'service-' + service.number}
				>
					<div class="service-top">
						<span class="service-icon">{@render icon(service.icon)}</span>
						<span>{service.number}<span aria-hidden="true"> /</span></span>
					</div>
					<h3 id={'service-' + service.number}>{service.title}</h3>
					<p>{service.copy}</p>
					<div class="service-detail">
						<span class="check" aria-hidden="true">✓</span>{service.detail}
					</div>
				</article>
			{/each}
		</div>
		<div class="coaching-bottom">
			<a class="text-link" href={resolve('/contact')}
				>Talk about your goals<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					aria-hidden="true"
					><path
						d="M6 18 18 6M6 6h12v12"
						stroke="currentColor"
						stroke-width="1.6"
						stroke-linecap="round"
						stroke-linejoin="round"
					/></svg
				></a
			>
		</div>
	</div>
</section>

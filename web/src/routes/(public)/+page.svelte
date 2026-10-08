<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import FitnessScene from '$lib/components/landing/FitnessScene.svelte';
	import CoachingSection from '$lib/components/landing/CoachingSection.svelte';
	import FaqSection from '$lib/components/sections/FaqSection.svelte';
	import TransformationCarousel from '$lib/components/sections/TransformationCarousel.svelte';
	import { reveal } from '$lib/components/landing/motion';
	import { publicHref } from '$lib/content/links';
	import { orderedHomeSections } from '$lib/content/home-sections';
	let { data } = $props();
	const site = $derived(data.site),
		c = $derived(site.home),
		proof = $derived(c.proof);
	let progressWordIndex = $state(0);
	function sectionNumber(id: string) {
		const numbered = orderedHomeSections(c.sectionOrder).filter((key) =>
			[
				'about',
				'coaching',
				'transformations',
				'testimonials',
				...(c.products.enabled ? ['products'] : [])
			].includes(key)
		);
		return String(numbered.indexOf(id as (typeof numbered)[number]) + 1).padStart(2, '0');
	}
	onMount(() => {
		const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
		let timer: ReturnType<typeof setInterval> | undefined;
		function sync() {
			if (timer) clearInterval(timer);
			timer = undefined;
			if (!preference.matches)
				timer = setInterval(() => {
					progressWordIndex = (progressWordIndex + 1) % c.hero.rotatingWords.length;
				}, 1500);
		}
		sync();
		preference.addEventListener('change', sync);
		return () => {
			if (timer) clearInterval(timer);
			preference.removeEventListener('change', sync);
		};
	});
</script>

{#snippet arrow()}<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"
		><path
			d="M6 18 18 6M6 6h12v12"
			stroke="currentColor"
			stroke-width="1.6"
			stroke-linecap="round"
			stroke-linejoin="round"
		/></svg
	>{/snippet}
{#snippet serviceIcon(name: string)}
	<svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
		{#if name === 'training'}<path d="m7 21 14-14M4 18l10 10M18 4l10 10M3 23l6 6M23 3l6 6" />
		{:else if name === 'nutrition'}<path
				d="M17 10c-2-8 5-8 8-7-1 6-5 8-8 7ZM16 12c-5-4-12-1-12 6 0 5 4 11 9 10l3-1 3 1c5 1 9-5 9-10 0-7-7-10-12-6ZM16 12c0-4-2-6-4-7"
			/>
		{:else}<path d="M5 6h22v16H16l-7 5v-5H5V6ZM10 12h12M10 17h7" />{/if}
	</svg>
{/snippet}
{#snippet heroSection()}
	<section class="hero container" aria-labelledby="hero-title">
		<div class="hero-copy">
			<h1 id="hero-title" use:reveal={70}>
				{c.hero.firstLine}<br />{c.hero.secondLine}
				<span
					class="cyan-text rotating-word"
					aria-live="off"
					style:--word-width={Math.max(...c.hero.rotatingWords.map((word: string) => word.length)) +
						'ch'}
				>
					{#key progressWordIndex}<span
							in:fly={{ y: 14, duration: 420, delay: 80 }}
							out:fly={{ y: -14, duration: 320 }}
							>{c.hero.rotatingWords[progressWordIndex % c.hero.rotatingWords.length]}</span
						>{/key}
				</span>
			</h1>
			<p class="hero-description pre-line" use:reveal={180}>{c.hero.copy}</p>
			<div class="hero-actions" use:reveal={230}>
				<a class="button" href={publicHref('/contact', data.preview)}
					>{c.hero.cta}{@render arrow()}</a
				><a class="text-link" href="#coaching">{c.hero.explore} ↓</a>
			</div>
		</div>
		<div class="hero-visual" use:reveal={130}>
			<div class="visual-heading">
				<span>{c.hero.visualLabel}</span><span class="plus" aria-hidden="true">+</span>
			</div>
			{#if c.hero.image}<img
					class="hero-cms-image"
					src={c.hero.image}
					alt={c.hero.imageAlt}
					fetchpriority="high"
				/>
			{:else}<div class="visual-statement pre-line" aria-hidden="true">{c.hero.visualTitle}</div>
				<div class="scene-wrap"><FitnessScene /></div>{/if}
		</div>
	</section>
{/snippet}

{#snippet principlesSection()}
	<div class="principles">
		<div class="container">
			{#each c.hero.principles as principle, index (index)}{#if index}<i aria-hidden="true">✳</i
					>{/if}<span>{principle}</span>{/each}
		</div>
	</div>
{/snippet}

{#snippet aboutSection()}
	<section id="about" class="section about-grid container" aria-labelledby="about-title">
		<div class="coach-portrait" use:reveal>
			<div class="portrait-top">
				<span class="eyebrow">{c.about.portraitLabel}</span><span aria-hidden="true">↗</span>
			</div>
			{#if site.brand.portrait}<img
					class="coach-photo"
					src={site.brand.portrait}
					alt={site.brand.portraitAlt}
					loading="lazy"
				/>
			{:else}<div class="portrait-placeholder" role="img" aria-label={site.brand.portraitAlt}>
					<span class="portrait-initial" aria-hidden="true">{site.brand.founder.charAt(0)}.</span
					><span class="asset-label">{site.brand.portraitPlaceholder}</span>
				</div>{/if}
			<div class="portrait-bottom">
				<div><strong>{site.brand.founder}.</strong><span>{site.brand.role}</span></div>
				<span class="portrait-seal pre-line" aria-hidden="true">{site.brand.tagline}</span>
			</div>
		</div>
		<div class="about-copy" use:reveal={100}>
			<p class="eyebrow">
				<span class="section-number">{sectionNumber('about')}</span>{c.about.eyebrow}
			</p>
			<h2 id="about-title">
				{c.about.heading.first}<br /><span class="outlined-text">{c.about.heading.accent}</span>
			</h2>
			<p class="section-intro">{c.about.intro}</p>
			<p class="pre-line">{c.about.copy}</p>
			<p class="pre-line">{site.brand.bio}</p>
			<div class="philosophy-note">
				<span aria-hidden="true">↗</span>
				<p class="pre-line">{c.about.philosophy}</p>
			</div>
		</div>
	</section>
{/snippet}

{#snippet coachingSection()}
	<CoachingSection
		services={site.services}
		content={c.coaching}
		icon={serviceIcon}
		preview={data.preview}
		number={sectionNumber('coaching')}
	/>
{/snippet}

{#snippet transformationsSection()}
	<section id="transformations" class="section container" aria-labelledby="transformations-title">
		<div class="section-heading" use:reveal>
			<div>
				<p class="eyebrow">
					<span class="section-number">{sectionNumber('transformations')}</span>{proof.eyebrow}
				</p>
				<h2 id="transformations-title">
					{proof.heading.first}<br /><span class="outlined-text">{proof.heading.accent}</span>
				</h2>
			</div>
		</div>
		<TransformationCarousel items={data.transformations} {proof} />
	</section>
{/snippet}

{#snippet testimonialsSection()}
	<section class="testimonial-section" aria-labelledby="testimonials-title">
		<div class="testimonial-layout container">
			<div use:reveal>
				<p class="eyebrow">
					<span class="section-number">{sectionNumber('testimonials')}</span
					>{proof.testimonialEyebrow}
				</p>
				<h2 id="testimonials-title">
					{proof.testimonialHeading.first}<br /><span class="outlined-text"
						>{proof.testimonialHeading.accent}</span
					>
				</h2>
			</div>
			<div class="testimonial-content" use:reveal={100}>
				{#if data.testimonials.length}{#each data.testimonials as testimonial (testimonial.id)}<blockquote
						>
							<span class="quote-mark" aria-hidden="true">“</span>{#if testimonial.image_url}<img
									class="testimonial-avatar"
									src={testimonial.image_url}
									alt={testimonial.image_alt || testimonial.name}
									loading="lazy"
								/>{/if}
							<p>{testimonial.quote}</p>
							<footer>
								{testimonial.name}{#if testimonial.role}<span> / {testimonial.role}</span>{/if}
							</footer>
						</blockquote>{/each}
				{:else}<div class="testimonial-placeholder">
						<span class="quote-mark" aria-hidden="true">“</span>
						<p class="pre-line">{proof.testimonialPlaceholder}</p>
						<div class="testimonial-status">
							<span class="status-dot"></span>{proof.testimonialStatus}
						</div>
						<span class="testimonial-hint">{proof.testimonialHint}</span>
					</div>{/if}
			</div>
		</div>
	</section>
{/snippet}

{#snippet productsSection()}
	{#if c.products.enabled}<section
			id="products"
			class="section container"
			aria-labelledby="products-title"
		>
			<div class="section-heading" use:reveal>
				<div>
					<p class="eyebrow">
						<span class="section-number">{sectionNumber('products')}</span>{c.products.eyebrow}
					</p>
					<h2 id="products-title">
						{c.products.heading.first}<br /><span class="outlined-text"
							>{c.products.heading.accent}</span
						>
					</h2>
				</div>
			</div>
			<div class="product-grid">
				{#each c.products.items as product, index (index)}<article
						class="product-card"
						use:reveal={index * 80}
					>
						<div class={'product-art ' + ['book-cyan', 'book-dark', 'book-light'][index % 3]}>
							{#if product.image}<img
									class="product-cover-image"
									src={product.image}
									alt={product.imageAlt || product.title}
									loading="lazy"
								/>
							{:else}<div class="book-3d" role="img" aria-label={product.title}>
									<div class="book-cover">
										<span>{c.products.coverLabel}</span><strong>{product.cover}</strong>
										<div>
											<span class="pre-line">{c.products.coverNote}</span><span
												>{String(index + 1).padStart(2, '0')}</span
											>
										</div>
									</div>
									<div class="book-pages"></div>
									<div class="book-spine"></div>
								</div>
								<span class="asset-label">{c.products.placeholderLabel}</span>{/if}
						</div>
						<div class="story-meta">
							<span>{product.type}</span><span class="coming-soon">{product.status}</span>
						</div>
						<h3>{product.title}</h3>
						<p>{product.copy}</p>
					</article>{/each}
			</div>
		</section>{/if}
{/snippet}

{#snippet appSection()}
	{#if c.app.enabled}<section class="app-section container" aria-labelledby="app-title">
			<div class="app-copy" use:reveal>
				<p class="eyebrow"><span class="status-dot"></span>{c.app.eyebrow}</p>
				<h2 id="app-title">{c.app.heading.first}<br /><span>{c.app.heading.accent}</span></h2>
				<p class="pre-line">{c.app.copy}</p>
				{#if c.app.ready}<a
						class="button"
						href={c.app.url}
						target="_blank"
						rel="noopener noreferrer"
						>{c.app.cta}{@render arrow()}<span class="sr-only">(opens in a new tab)</span></a
					>{:else}<span class="coming-soon">{c.app.unavailable}</span>{/if}
			</div>
			<div class="app-art" use:reveal={120}>
				{#if c.app.previewImage}<img
						class="app-preview-image"
						src={c.app.previewImage}
						alt={c.app.previewAlt}
						loading="lazy"
					/>{:else}<div class="app-orbit" aria-hidden="true"></div>
					<div class="app-device" role="img" aria-label={c.app.previewAlt}>
						<div class="device-camera"></div>
						<div class="device-screen">
							<span class="device-wordmark">{site.brand.wordmark}</span>
							<div class="app-mark" aria-hidden="true">C<span>↗</span></div>
							<strong class="pre-line">{c.app.deviceHeading}</strong><span class="device-rule"
							></span><small>{c.app.previewLabel}</small>
						</div>
					</div>{/if}
			</div>
		</section>{/if}
{/snippet}

{#snippet faqSection()}
	<FaqSection content={site.faq} />
{/snippet}

{#snippet contactSection()}
	<section id="contact" class="section contact-section container" aria-labelledby="contact-title">
		<div class="contact-orbit" aria-hidden="true"></div>
		<h2 id="contact-title" use:reveal={60}>
			{c.contact.heading.first}<br /><span class="outlined-text">{c.contact.heading.accent}</span>
		</h2>
		<p class="pre-line" use:reveal={100}>{c.contact.copy}</p>
		<div class="contact-actions" use:reveal={150}>
			<a class="button" href={publicHref('/contact', data.preview)}
				>{c.contact.cta}{@render arrow()}</a
			><a class="email-link" href={'mailto:' + site.brand.email}>{site.brand.email}</a>
		</div>
	</section>
{/snippet}

{#each orderedHomeSections(c.sectionOrder) as section (section)}
	{#if section === 'hero'}{@render heroSection()}
	{:else if section === 'principles'}{@render principlesSection()}
	{:else if section === 'about'}{@render aboutSection()}
	{:else if section === 'coaching'}{@render coachingSection()}
	{:else if section === 'transformations'}{@render transformationsSection()}
	{:else if section === 'testimonials'}{@render testimonialsSection()}
	{:else if section === 'products'}{@render productsSection()}
	{:else if section === 'app'}{@render appSection()}
	{:else if section === 'faq'}{@render faqSection()}
	{:else if section === 'contact'}{@render contactSection()}
	{/if}
{/each}

<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import Arrow from '$lib/components/landing/Arrow.svelte';
	import FitnessScene from '$lib/components/landing/FitnessScene.svelte';
	import CoachingSection from '$lib/components/landing/CoachingSection.svelte';
	import SectionLabel from '$lib/components/landing/SectionLabel.svelte';
	import SectionTitle from '$lib/components/landing/SectionTitle.svelte';
	import FaqSection from '$lib/components/sections/FaqSection.svelte';
	import TransformationCarousel from '$lib/components/sections/TransformationCarousel.svelte';
	import { reveal } from '$lib/components/landing/motion';
	import { publicHref } from '$lib/content/links';
	import { orderedHomeSections } from '$lib/content/home-sections';
	import {
		anchor,
		button,
		buttonInk,
		buttonOnDark,
		cardCopy,
		container,
		labelSpacing,
		labelText,
		mark,
		rail,
		section as sectionSpacing,
		statusDot,
		textLink
	} from '$lib/components/landing/styles';
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
	/** Rubber gym-mat texture, kept as the one brand surface on dark panels. */
	const matPanel =
		'bg-night bg-[image:var(--image-gym-mat),radial-gradient(ellipse_at_38%_28%,#3e5357,#26393e_78%)] bg-size-[160px_160px,100%_100%]';
	const darkChip =
		'inline-block rounded-[3px] border border-white/25 px-3 pt-[0.4rem] pb-[0.3rem] font-display text-[0.9375rem]/none tracking-[0.18em] text-bone';
	/** Flat cover colours for the product tiles, repeated every three. */
	const covers = [
		{ tile: 'bg-cyan text-ink', title: 'text-ink', note: 'text-ink/75' },
		{ tile: 'bg-night text-bone', title: 'text-cyan', note: 'text-[#b6cdd1]' },
		{ tile: 'bg-bone-deep text-ink', title: 'text-ink', note: 'text-ink-soft' }
	];
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

{#snippet heroSection()}
	<section
		class="{container} grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] items-center gap-x-[clamp(32px,5vw,72px)] gap-y-14 pt-[clamp(40px,6vw,88px)] pb-[clamp(64px,8vw,120px)] cq-58:grid-cols-[minmax(0,1fr)]"
		aria-labelledby="hero-title"
	>
		<div>
			<h1 id="hero-title" use:reveal={70}>
				{c.hero.firstLine}<br />{c.hero.secondLine}
				<span class="{mark} relative inline-grid align-baseline" data-mark aria-live="off">
					<!-- Invisible copies of every word size the slot to the widest one. -->
					{#each c.hero.rotatingWords as word, index (index)}<span
							class="invisible [grid-area:1/1]"
							aria-hidden="true">{word}</span
						>{/each}
					{#key progressWordIndex}<span
							class="top-0 left-0 [grid-area:1/1]"
							in:fly={{ y: 14, duration: 420, delay: 80 }}
							out:fly={{ y: -14, duration: 320 }}
							>{c.hero.rotatingWords[progressWordIndex % c.hero.rotatingWords.length]}</span
						>{/key}
				</span>
			</h1>
			<p
				class="mt-9 max-w-[30rem] text-[1.125rem]/[1.75] whitespace-pre-line text-ink-soft"
				use:reveal={180}
			>
				{c.hero.copy}
			</p>
			<div class="mt-10 flex flex-wrap items-center gap-x-9 gap-y-4" use:reveal={230}>
				<a class={button} href={publicHref('/contact', data.preview)}>{c.hero.cta}<Arrow /></a><a
					class={textLink}
					href="#coaching">{c.hero.explore}</a
				>
			</div>
		</div>
		<div
			class="relative isolate before:absolute before:inset-0 before:-z-10 before:translate-x-4 before:translate-y-4 before:bg-cyan before:content-[''] cq-58:mx-auto cq-58:w-full cq-58:max-w-[34rem]"
			use:reveal={130}
		>
			<div
				class="{matPanel} relative aspect-[4/5] min-h-[400px] w-full overflow-hidden rounded-[3px] text-bone"
			>
				{#if c.hero.image}<img
						class="absolute inset-0 size-full object-cover"
						src={c.hero.image}
						alt={c.hero.imageAlt}
						fetchpriority="high"
					/>
					<div
						class="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-night/70 to-transparent"
						aria-hidden="true"
					></div>
				{:else}<div
						class="absolute inset-x-7 top-[4.25rem] font-display text-[clamp(3rem,5vw,4.5rem)]/[0.92] whitespace-pre-line text-[#86a6ab]"
						aria-hidden="true"
					>
						{c.hero.visualTitle}
					</div>
					<div class="absolute inset-x-0 top-[34%] bottom-0"><FitnessScene /></div>{/if}
				<p
					class="absolute top-6 left-7 z-[1] m-0 font-display text-[1rem]/none tracking-[0.2em] text-cyan"
				>
					{c.hero.visualLabel}
				</p>
			</div>
		</div>
	</section>
{/snippet}

{#snippet principlesSection()}
	<div class="bg-night text-bone">
		<div
			class="{container} flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-6 font-display text-[clamp(1.25rem,2vw,1.75rem)]/none tracking-[0.12em] bp-640:grid bp-640:grid-cols-[repeat(2,minmax(0,1fr))] bp-640:gap-y-4 bp-640:py-7"
		>
			{#each c.hero.principles as principle, index (index)}{#if index}<span
						class="h-6 w-px [transform:rotate(22deg)] bg-cyan bp-640:hidden"
						aria-hidden="true"
					></span>{/if}<span>{principle}</span>{/each}
		</div>
	</div>
{/snippet}

{#snippet aboutSection()}
	<section id="about" class="{sectionSpacing} {anchor}" aria-labelledby="about-title">
		<div
			class="{container} grid grid-cols-[minmax(0,5fr)_minmax(0,6fr)] items-center gap-x-[clamp(48px,8vw,128px)] gap-y-16 cq-58:grid-cols-[minmax(0,1fr)]"
		>
			<figure class="m-0 cq-58:max-w-[30rem]" use:reveal>
				<div class="relative isolate">
					<div
						class="absolute inset-0 -z-10 translate-x-4 translate-y-4 bg-cyan"
						aria-hidden="true"
					></div>
					{#if site.brand.portrait}<img
							class="aspect-[4/5] w-full rounded-[3px] object-cover"
							src={site.brand.portrait}
							alt={site.brand.portraitAlt}
							loading="lazy"
						/>
					{:else}<div
							class="relative grid aspect-[4/5] place-items-center rounded-[3px] bg-mist"
							role="img"
							aria-label={site.brand.portraitAlt}
						>
							<span
								class="font-display text-[clamp(8rem,16vw,13rem)] leading-none text-cyan-deep/45"
								aria-hidden="true">{site.brand.founder.charAt(0)}.</span
							><span
								class="absolute bottom-5 font-display text-[0.9375rem]/none tracking-[0.2em] text-ink-soft"
								>{site.brand.portraitPlaceholder}</span
							>
						</div>{/if}
				</div>
				<figcaption class="mt-8">
					<span class="block font-display text-[1rem]/none tracking-[0.2em] text-cyan-deep"
						>{c.about.portraitLabel}</span
					>
					<strong
						class="mt-3 block font-display text-[clamp(2.5rem,4vw,3.25rem)]/none font-normal text-ink"
						>{site.brand.founder}.</strong
					><span class="mt-2 block text-[0.875rem]/[1.5] text-ink-soft">{site.brand.role}</span>
				</figcaption>
			</figure>
			<div use:reveal={100}>
				<SectionLabel number={sectionNumber('about')}>{c.about.eyebrow}</SectionLabel>
				<SectionTitle id="about-title" heading={c.about.heading} />
				<p class="mt-9 text-[clamp(1.25rem,1.9vw,1.5rem)]/[1.55] text-ink">
					{c.about.intro}
				</p>
				<p class="mt-5 text-[1.0625rem] whitespace-pre-line">{c.about.copy}</p>
				<p class="mt-5 text-[1.0625rem] whitespace-pre-line">{site.brand.bio}</p>
				<p
					class="mt-10 border-t-2 border-t-ink pt-6 font-display text-[clamp(1.875rem,2.8vw,2.5rem)]/[1.04] whitespace-pre-line text-ink"
				>
					{c.about.philosophy}
				</p>
			</div>
		</div>
	</section>
{/snippet}

{#snippet coachingSection()}
	<CoachingSection
		services={site.services}
		content={c.coaching}
		preview={data.preview}
		number={sectionNumber('coaching')}
	/>
{/snippet}

{#snippet transformationsSection()}
	<section
		id="transformations"
		class="{sectionSpacing} {anchor}"
		aria-labelledby="transformations-title"
	>
		<div class={container}>
			<div class="mb-14 bp-640:mb-10" use:reveal>
				<SectionLabel number={sectionNumber('transformations')}>{proof.eyebrow}</SectionLabel>
				<SectionTitle id="transformations-title" heading={proof.heading} />
			</div>
			<TransformationCarousel items={data.transformations} {proof} />
		</div>
	</section>
{/snippet}

{#snippet testimonialsSection()}
	<section class="bg-night py-[clamp(72px,9vw,128px)]" aria-labelledby="testimonials-title">
		<div class="{container} {rail} items-start">
			<div class="sticky top-28 cq-58:static" use:reveal>
				<SectionLabel tone="dark" number={sectionNumber('testimonials')}
					>{proof.testimonialEyebrow}</SectionLabel
				>
				<SectionTitle id="testimonials-title" tone="dark" heading={proof.testimonialHeading} />
			</div>
			<div use:reveal={100}>
				{#if data.testimonials.length}{#each data.testimonials as testimonial (testimonial.id)}<blockquote
							class="m-0 not-first:mt-14 not-first:border-t not-first:border-t-white/15 not-first:pt-14"
						>
							<span class="block h-12 font-display text-[8rem]/[0.8] text-cyan" aria-hidden="true"
								>“</span
							>
							<p class="mt-3 text-[clamp(1.5rem,2.6vw,2.125rem)]/[1.45] text-bone">
								{testimonial.quote}
							</p>
							<footer class="mt-8 flex items-center gap-4">
								{#if testimonial.image_url}<img
										class="size-14 rounded-[50%] object-cover"
										src={testimonial.image_url}
										alt={testimonial.image_alt || testimonial.name}
										loading="lazy"
									/>{/if}
								<div>
									<span class="block font-display text-[1.375rem]/none tracking-[0.12em] text-cyan"
										>{testimonial.name}</span
									>{#if testimonial.role}<span class="mt-1 block text-[0.875rem] text-[#b6cdd1]"
											>{testimonial.role}</span
										>{/if}
								</div>
							</footer>
						</blockquote>{/each}
				{:else}<div>
						<span class="block h-12 font-display text-[8rem]/[0.8] text-cyan" aria-hidden="true"
							>“</span
						>
						<p
							class="mt-3 text-[clamp(1.5rem,2.6vw,2.125rem)]/[1.45] whitespace-pre-line text-bone"
						>
							{proof.testimonialPlaceholder}
						</p>
						<div
							class="mt-8 flex items-center gap-3 font-display text-[1rem]/none tracking-[0.18em] text-cyan"
						>
							<span class="{statusDot} bg-cyan"></span>{proof.testimonialStatus}
						</div>
						<span class="mt-3 block max-w-[22rem] text-[0.875rem]/[1.7] text-[#b6cdd1]"
							>{proof.testimonialHint}</span
						>
					</div>{/if}
			</div>
		</div>
	</section>
{/snippet}

{#snippet productsSection()}
	{#if c.products.enabled}<section
			id="products"
			class="{sectionSpacing} {anchor}"
			aria-labelledby="products-title"
		>
			<div class={container}>
				<div class="mb-14 bp-640:mb-10" use:reveal>
					<SectionLabel number={sectionNumber('products')}>{c.products.eyebrow}</SectionLabel>
					<SectionTitle id="products-title" heading={c.products.heading} />
				</div>
				<div
					class="grid grid-cols-[repeat(3,minmax(0,1fr))] items-start gap-x-8 gap-y-14 [--stagger:4rem] cq-58:grid-cols-[repeat(2,minmax(0,1fr))] cq-58:[--stagger:0px] cq-52:grid-cols-[minmax(0,1fr)]"
				>
					{#each c.products.items as product, index (index)}{@const cover = covers[index % 3]}
						<article class={index % 3 === 1 ? 'mt-(--stagger)' : ''} use:reveal={index * 80}>
							{#if product.image}<img
									class="aspect-[4/5] w-full rounded-[3px] bg-mist object-cover"
									src={product.image}
									alt={product.imageAlt || product.title}
									loading="lazy"
								/>
							{:else}<div
									class="{cover.tile} flex aspect-[4/5] flex-col justify-between rounded-[3px] p-6 [box-shadow:0_22px_32px_-22px_#0f1e2480]"
									role="img"
									aria-label={product.title}
								>
									<div
										class="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 font-display text-[0.875rem]/none tracking-[0.18em]"
									>
										<span>{c.products.coverLabel}</span><span class="opacity-70"
											>{c.products.placeholderLabel}</span
										>
									</div>
									<strong
										class="{cover.title} font-display text-[clamp(3.5rem,5.4vw,4.75rem)]/[0.92] font-normal whitespace-pre-line"
										>{product.cover}</strong
									>
									<div class="flex items-end justify-between gap-3">
										<span class="{cover.note} text-[0.75rem]/[1.5] whitespace-pre-line"
											>{c.products.coverNote}</span
										><span class="font-display text-[1.75rem]/none"
											>{String(index + 1).padStart(2, '0')}</span
										>
									</div>
								</div>{/if}
							<div
								class="mt-6 mb-3 flex items-center justify-between gap-3 font-display text-[0.9375rem]/none tracking-[0.18em] text-ink-soft"
							>
								<span>{product.type}</span><span
									class="rounded-[3px] border border-ink/25 px-2 pt-1 pb-0.5 text-[0.8125rem]"
									>{product.status}</span
								>
							</div>
							<h3>{product.title}</h3>
							<p class={cardCopy}>{product.copy}</p>
						</article>{/each}
				</div>
			</div>
		</section>{/if}
{/snippet}

{#snippet appSection()}
	{#if c.app.enabled}<section class="bg-night text-bone" aria-labelledby="app-title">
			<div
				class="{container} grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-center gap-x-16 gap-y-12 py-[clamp(64px,8vw,112px)] cq-58:grid-cols-[minmax(0,1fr)]"
			>
				<div use:reveal>
					<p class="{labelText} {labelSpacing} text-[#b6cdd1]">
						<span class="{statusDot} bg-cyan"></span>{c.app.eyebrow}
					</p>
					<SectionTitle id="app-title" tone="dark" heading={c.app.heading} />
					<p
						class="mt-8 mb-10 max-w-[30rem] text-[1.0625rem]/[1.75] whitespace-pre-line text-[#b6cdd1]"
					>
						{c.app.copy}
					</p>
					{#if c.app.ready}<a
							class={buttonOnDark}
							href={c.app.url}
							target="_blank"
							rel="noopener noreferrer"
							>{c.app.cta}<Arrow /><span class="sr-only">(opens in a new tab)</span></a
						>{:else}<span class={darkChip}>{c.app.unavailable}</span>{/if}
				</div>
				<div
					class="group/art relative grid h-[420px] place-items-center [perspective:900px] bp-640:h-[360px]"
					use:reveal={120}
				>
					{#if c.app.previewImage}<img
							class="size-full object-contain"
							src={c.app.previewImage}
							alt={c.app.previewAlt}
							loading="lazy"
						/>{:else}<div
							class="absolute size-[340px] rounded-[50%] border border-[#466068] after:absolute after:inset-7 after:rounded-[50%] after:border after:border-[#344d55] after:content-[''] bp-640:size-[290px]"
							aria-hidden="true"
						></div>
						<div
							class="relative h-[360px] w-[184px] [transform:rotateY(-14deg)_rotateZ(7deg)] rounded-[28px] bg-[linear-gradient(110deg,#a0b4b5,#53686b_55%,#c3d7d7)] p-2 [box-shadow:16px_20px_35px_#0004] [transition:transform_0.7s_cubic-bezier(0.22,1,0.36,1)] group-hover/art:[transform:rotateY(-6deg)_rotateZ(3deg)_translateY(-5px)] motion-reduce:group-hover/art:[transform:rotateY(-14deg)_rotateZ(7deg)] bp-640:[scale:0.92]"
							role="img"
							aria-label={c.app.previewAlt}
						>
							<div
								class="absolute top-[14px] left-1/2 z-[1] h-[10px] w-[52px] [transform:translateX(-50%)] rounded-[20px] bg-[#23383f]"
							></div>
							<div
								class="flex h-full flex-col items-start justify-between rounded-[21px] bg-[#e5f5f2] px-[18px] pt-[38px] pb-[17px] text-ink"
							>
								<span class="font-display text-[1.125rem]/none tracking-[0.04em]"
									>{site.brand.wordmark}</span
								>
								<strong
									class="block font-display text-[2rem]/[1.02] font-normal whitespace-pre-line"
									>{c.app.deviceHeading}</strong
								><span class="h-1 w-full rounded-[5px] bg-cyan"></span><small
									class="text-[0.5rem]/[1.4] tracking-[0.06em] text-[#536c6c]"
									>{c.app.previewLabel}</small
								>
							</div>
						</div>{/if}
				</div>
			</div>
		</section>{/if}
{/snippet}

{#snippet faqSection()}
	<FaqSection content={site.faq} />
{/snippet}

{#snippet contactSection()}
	<section id="contact" class="{anchor} bg-cyan" aria-labelledby="contact-title">
		<div
			class="{container} grid grid-cols-[minmax(0,7fr)_minmax(0,4fr)] items-end gap-x-16 gap-y-10 py-[clamp(72px,10vw,144px)] cq-58:grid-cols-[minmax(0,1fr)]"
		>
			<div use:reveal={60}>
				<SectionTitle
					id="contact-title"
					tone="cyan"
					heading={c.contact.heading}
					class="text-[clamp(4rem,9vw,8.5rem)] leading-[0.88]"
				/>
			</div>
			<div use:reveal={140}>
				<p class="max-w-[26rem] text-[1.0625rem]/[1.7] whitespace-pre-line text-ink">
					{c.contact.copy}
				</p>
				<div class="mt-8 flex flex-col items-start gap-3">
					<a class={buttonInk} href={publicHref('/contact', data.preview)}
						>{c.contact.cta}<Arrow /></a
					><a
						class="inline-flex min-h-11 items-center text-[0.9375rem] text-ink underline decoration-2 underline-offset-4 hover:decoration-4"
						href={'mailto:' + site.brand.email}>{site.brand.email}</a
					>
				</div>
			</div>
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

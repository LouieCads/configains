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
	import {
		anchor,
		appButton,
		button,
		buttonArrow,
		cardCopy,
		comingSoon,
		container,
		eyebrow,
		eyebrowSpacing,
		eyebrowText,
		matSurface,
		outlined,
		section as sectionSpacing,
		sectionHeading,
		sectionNumber as sectionNumberClass,
		statusDot,
		storyMeta,
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
	const aboutCopy =
		'mt-[19px] text-[1rem] whitespace-pre-line bp-850:text-[0.9375rem] bp-640:text-[1rem]';
	const quoteMark = 'block h-12 font-[Georgia,serif] text-[5.1875rem] leading-[0.8] text-cyan-ink';
	const quote = 'mt-[13px] text-[1.5625rem] leading-[1.65] text-ink bp-640:text-[1.4375rem]';
	/** Mat colours and cover styling for the three alternating product books. */
	const books = [
		{
			art: '[--mat-base:#293d41] [--mat-light:#3d5356] before:border-[#ffffff0f]',
			label: 'text-[#d0e0dd]',
			cover: 'bg-cyan',
			title: '',
			spine: 'bg-[#33a7b5]'
		},
		{
			art: '[--mat-base:#b4c4c1] [--mat-light:#d1dbd7] before:border-[#344e501a]',
			label: 'text-[#364e50]',
			cover: 'bg-ink text-[#f5faf8]',
			title: 'text-cyan',
			spine: 'bg-[#16262b]'
		},
		{
			art: '[--mat-base:#2e4143] [--mat-light:#455b5a] before:border-[#ffffff0f]',
			label: 'text-[#d0e0dd]',
			cover: 'bg-[#d9e5dc]',
			title: '',
			spine: 'bg-[#a9bbae]'
		}
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

{#snippet arrow()}<svg
		class={buttonArrow}
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
	>{/snippet}
{#snippet serviceIcon(name: string)}
	<svg
		class="[stroke:currentColor] [stroke-width:1.4] [stroke-linecap:round] [stroke-linejoin:round]"
		width="32"
		height="32"
		viewBox="0 0 32 32"
		fill="none"
		aria-hidden="true"
	>
		{#if name === 'training'}<path d="m7 21 14-14M4 18l10 10M18 4l10 10M3 23l6 6M23 3l6 6" />
		{:else if name === 'nutrition'}<path
				d="M17 10c-2-8 5-8 8-7-1 6-5 8-8 7ZM16 12c-5-4-12-1-12 6 0 5 4 11 9 10l3-1 3 1c5 1 9-5 9-10 0-7-7-10-12-6ZM16 12c0-4-2-6-4-7"
			/>
		{:else}<path d="M5 6h22v16H16l-7 5v-5H5V6ZM10 12h12M10 17h7" />{/if}
	</svg>
{/snippet}
{#snippet heroSection()}
	<section
		class="{container} grid grid-cols-[repeat(auto-fit,minmax(min(100%,26rem),1fr))] items-center gap-[55px] pt-[72px] pb-[92px] wide:gap-[85px] bp-1100:gap-[35px] bp-1100:pt-[64px] bp-1100:pb-[78px] bp-850:gap-[22px] bp-850:pt-[50px] bp-850:pb-[65px] bp-640:gap-[37px] bp-640:pt-10 bp-640:pb-[55px] cq-52:grid-cols-[minmax(0,1fr)]"
		aria-labelledby="hero-title"
	>
		<div>
			<h1 id="hero-title" use:reveal={70}>
				{c.hero.firstLine}<br />{c.hero.secondLine}
				<span
					class="relative inline-grid min-w-[min(var(--word-width,9ch),100%)] align-baseline text-cyan-ink"
					aria-live="off"
					style:--word-width={Math.max(...c.hero.rotatingWords.map((word: string) => word.length)) +
						'ch'}
				>
					{#key progressWordIndex}<span
							class="top-0 left-0 [grid-area:1/1]"
							in:fly={{ y: 14, duration: 420, delay: 80 }}
							out:fly={{ y: -14, duration: 320 }}
							>{c.hero.rotatingWords[progressWordIndex % c.hero.rotatingWords.length]}</span
						>{/key}
				</span>
			</h1>
			<p
				class="mt-7 max-w-[430px] text-[1rem] leading-[1.85] whitespace-pre-line bp-850:text-[0.9375rem] bp-640:mt-6 bp-640:max-w-[500px] bp-640:text-[1rem] cq-52:max-w-[38rem]"
				use:reveal={180}
			>
				{c.hero.copy}
			</p>
			<div
				class="mt-[31px] flex flex-wrap items-center gap-[23px] bp-1100:gap-[17px] bp-1024:justify-center bp-850:flex-col bp-850:gap-[15px] bp-640:mt-[27px] bp-640:flex-row bp-640:gap-5 cq-52:flex-row"
				use:reveal={230}
			>
				<a class={button} href={publicHref('/contact', data.preview)}
					>{c.hero.cta}{@render arrow()}</a
				><a class={textLink} href="#coaching">{c.hero.explore} ↓</a>
			</div>
		</div>
		<div
			class="{matSurface} relative flex h-auto min-h-[558px] min-w-0 flex-col rounded-[18px] px-7 pt-[74px] pb-3 [--mat-base:#26393e] [--mat-light:#3e5357] bp-1100:min-h-[550px] bp-850:min-h-[490px] bp-640:mx-[5px] bp-640:min-h-[440px] bp-360:min-h-[395px] cq-52:w-full cq-52:max-w-[620px] cq-52:justify-self-center"
			use:reveal={130}
		>
			<div
				class="absolute top-[25px] right-[27px] left-[27px] z-[1] flex items-center justify-between font-[Arial] text-[0.625rem] leading-[normal] tracking-[1.5px] text-[#d2e2e2] bp-850:right-5 bp-850:left-5 bp-850:text-[0.5rem] bp-640:right-[22px] bp-640:left-[22px] bp-640:text-[0.5625rem] bp-360:text-[0.5rem]"
			>
				<span>{c.hero.visualLabel}</span><span
					class="font-[Arial] text-[1.5rem] leading-[normal] text-[#81abb0]"
					aria-hidden="true">+</span
				>
			</div>
			{#if c.hero.image}<img
					class="h-[400px] w-full rounded-[10px] object-cover"
					src={c.hero.image}
					alt={c.hero.imageAlt}
					fetchpriority="high"
				/>
			{:else}<div
					class="relative shrink-0 font-display text-[4.0625rem] leading-[0.94] font-normal tracking-[-1px] wrap-anywhere whitespace-pre-line text-[#728b8c] bp-850:text-[3.125rem] bp-640:text-[3.625rem] bp-360:text-[3rem]"
					aria-hidden="true"
				>
					{c.hero.visualTitle}
				</div>
				<div class="relative mx-[-24px] mt-3 min-h-[280px] flex-1"><FitnessScene /></div>{/if}
		</div>
	</section>
{/snippet}

{#snippet principlesSection()}
	<div class="border-y border-y-line text-ink">
		<div
			class="{container} flex items-center justify-between gap-[18px] py-6 font-['Bebas_Neue',Impact,sans-serif] text-[0.875rem] leading-[1.4] font-normal tracking-[1.8px] bp-850:gap-3 bp-850:text-[0.75rem] bp-850:tracking-[1px] bp-640:grid bp-640:grid-cols-[1fr_1fr] bp-640:gap-x-3 bp-640:gap-y-[14px] bp-640:py-[23px] bp-640:text-[0.875rem] bp-640:tracking-[1px] cq-52:grid cq-52:grid-cols-[repeat(2,minmax(0,1fr))]"
		>
			{#each c.hero.principles as principle, index (index)}{#if index}<i
						class="font-[Arial] text-[1.25rem] leading-[normal] font-normal text-cyan-ink not-italic bp-850:text-[0.9375rem] bp-640:hidden cq-52:hidden"
						aria-hidden="true">✳</i
					>{/if}<span>{principle}</span>{/each}
		</div>
	</div>
{/snippet}

{#snippet aboutSection()}
	<section
		id="about"
		class="{sectionSpacing} {container} {anchor} grid grid-cols-[repeat(auto-fit,minmax(min(100%,25rem),1fr))] items-center gap-[108px] bp-1100:gap-[60px] bp-850:gap-[35px] bp-640:grid-cols-1 bp-640:gap-[38px] cq-52:grid-cols-[minmax(0,1fr)]"
		aria-labelledby="about-title"
	>
		<div
			class="relative min-w-0 overflow-hidden rounded-[14px] border border-[#e0e5de] bg-[#e9ece7]"
			use:reveal
		>
			<div class="flex items-center justify-between px-[27px] py-[22px] bp-850:p-5">
				<span
					class="m-0 flex items-center gap-3 font-[Arial] text-[0.625rem] leading-[normal] font-normal tracking-[1.2px] text-[#748980] bp-850:text-[0.5rem] bp-640:text-[0.625rem]"
					>{c.about.portraitLabel}</span
				><span
					class="font-[Arial] text-[1.375rem] leading-[normal] text-[#748980]"
					aria-hidden="true">↗</span
				>
			</div>
			{#if site.brand.portrait}<img
					class="h-[332px] w-full object-cover"
					src={site.brand.portrait}
					alt={site.brand.portraitAlt}
					loading="lazy"
				/>
			{:else}<div
					class="relative flex h-[332px] flex-col items-center justify-center before:absolute before:size-[255px] before:rounded-[50%] before:border before:border-[#d0d9d1] before:content-[''] bp-850:h-[270px] bp-850:before:size-[210px]"
					role="img"
					aria-label={site.brand.portraitAlt}
				>
					<span
						class="[transform:translateX(6px)] font-display text-[205px] leading-none font-normal text-[#acbdb4] bp-850:text-[175px] bp-640:text-[185px]"
						aria-hidden="true">{site.brand.founder.charAt(0)}.</span
					><span
						class="absolute bottom-[18px] font-[Arial] text-[0.625rem]/[1.5] tracking-[1.4px] text-[#586f6c]"
						>{site.brand.portraitPlaceholder}</span
					>
				</div>{/if}
			<div
				class="flex items-center justify-between gap-5 border-t border-t-[#d6dfd6] bg-[#f0f3ed] px-7 py-[22px] bp-850:p-5 bp-640:px-[25px] bp-640:py-[22px]"
			>
				<div>
					<strong class="block font-display text-[2.6875rem] leading-none font-normal"
						>{site.brand.founder}.</strong
					><span
						class="mt-2 block font-[Arial] text-[0.625rem]/[1.5] tracking-[1.2px] text-muted bp-850:text-[0.5rem] bp-640:text-[0.625rem]"
						>{site.brand.role}</span
					>
				</div>
				<span
					class="flex size-[72px] [transform:rotate(-12deg)] items-center justify-center rounded-[50%] border border-[#adc2b7] text-center font-['Bebas_Neue',sans-serif] text-[11px]/[1.5] font-normal tracking-[0.8px] whitespace-pre-line text-[#506e63] bp-850:size-[57px] bp-850:text-[9px] bp-640:size-[67px] bp-640:text-[10px]"
					aria-hidden="true">{site.brand.tagline}</span
				>
			</div>
		</div>
		<div use:reveal={100}>
			<p class={eyebrow}>
				<span class={sectionNumberClass}>{sectionNumber('about')}</span>{c.about.eyebrow}
			</p>
			<h2
				id="about-title"
				class="bp-850:text-[3rem] bp-640:text-[3.3125rem] bp-360:text-[2.9375rem]"
			>
				{c.about.heading.first}<br /><span class={outlined}>{c.about.heading.accent}</span>
			</h2>
			<p
				class="mt-[27px] text-[1.3125rem] leading-[1.65] text-ink bp-850:text-[1.125rem] bp-640:text-[1.25rem]"
			>
				{c.about.intro}
			</p>
			<p class={aboutCopy}>{c.about.copy}</p>
			<p class={aboutCopy}>{site.brand.bio}</p>
			<div class="my-[27px] flex gap-4 border-l-2 border-l-cyan pl-[18px]">
				<span
					class="font-[Arial] text-[1.5625rem] leading-[normal] text-cyan-ink"
					aria-hidden="true">↗</span
				>
				<p
					class="text-[0.9375rem] whitespace-pre-line text-ink bp-850:text-[0.875rem] bp-640:text-[0.9375rem]"
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
		icon={serviceIcon}
		preview={data.preview}
		number={sectionNumber('coaching')}
	/>
{/snippet}

{#snippet transformationsSection()}
	<section
		id="transformations"
		class="{sectionSpacing} {container} {anchor}"
		aria-labelledby="transformations-title"
	>
		<div class={sectionHeading} use:reveal>
			<div>
				<p class={eyebrow}>
					<span class={sectionNumberClass}>{sectionNumber('transformations')}</span>{proof.eyebrow}
				</p>
				<h2 id="transformations-title">
					{proof.heading.first}<br /><span class={outlined}>{proof.heading.accent}</span>
				</h2>
			</div>
		</div>
		<TransformationCarousel items={data.transformations} {proof} />
	</section>
{/snippet}

{#snippet testimonialsSection()}
	<section
		class="border-y border-y-line bg-transparent py-[78px] bp-850:py-[65px]"
		aria-labelledby="testimonials-title"
	>
		<div
			class="{container} grid grid-cols-[1fr_1fr] items-center gap-[98px] bp-1100:gap-[55px] bp-850:grid-cols-1 bp-850:gap-[35px] cq-52:grid-cols-[minmax(0,1fr)] cq-52:gap-9"
		>
			<div use:reveal>
				<p class={eyebrow}>
					<span class={sectionNumberClass}>{sectionNumber('testimonials')}</span
					>{proof.testimonialEyebrow}
				</p>
				<h2 id="testimonials-title">
					{proof.testimonialHeading.first}<br /><span class={outlined}
						>{proof.testimonialHeading.accent}</span
					>
				</h2>
			</div>
			<div
				class="border-l border-l-[#b9d8da] pl-[45px] bp-1100:pl-[30px] bp-850:border-t bp-850:border-t-[#b9d8da] bp-850:pt-[35px] bp-850:pl-0 bp-850:[border-left:none] cq-52:pt-8 cq-52:pr-0 cq-52:pb-0 cq-52:pl-0 cq-52:[border-left:0]"
				use:reveal={100}
			>
				{#if data.testimonials.length}{#each data.testimonials as testimonial (testimonial.id)}<blockquote
							class="m-0 not-first:mt-[30px] not-first:border-t not-first:border-t-[#bfdada] not-first:pt-[30px]"
						>
							<span class={quoteMark} aria-hidden="true">“</span>{#if testimonial.image_url}<img
									class="my-3 size-16 rounded-[50%] object-cover"
									src={testimonial.image_url}
									alt={testimonial.image_alt || testimonial.name}
									loading="lazy"
								/>{/if}
							<p class={quote}>{testimonial.quote}</p>
							<footer class="mt-[21px] font-[Arial] text-[0.875rem] leading-[normal]">
								{testimonial.name}{#if testimonial.role}<span> / {testimonial.role}</span>{/if}
							</footer>
						</blockquote>{/each}
				{:else}<div>
						<span class={quoteMark} aria-hidden="true">“</span>
						<p class="{quote} whitespace-pre-line">{proof.testimonialPlaceholder}</p>
						<div
							class="mt-7 flex items-center gap-[9px] font-[Arial] text-[0.625rem]/[1.5] tracking-[1.2px]"
						>
							<span class="{statusDot} bg-cyan-ink"></span>{proof.testimonialStatus}
						</div>
						<span class="mt-[11px] block max-w-[320px] font-[Arial] text-[0.75rem]/[1.7] text-muted"
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
			class="{sectionSpacing} {container} {anchor}"
			aria-labelledby="products-title"
		>
			<div class={sectionHeading} use:reveal>
				<div>
					<p class={eyebrow}>
						<span class={sectionNumberClass}>{sectionNumber('products')}</span>{c.products.eyebrow}
					</p>
					<h2 id="products-title">
						{c.products.heading.first}<br /><span class={outlined}>{c.products.heading.accent}</span
						>
					</h2>
				</div>
			</div>
			<div
				class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-[26px] bp-850:gap-[17px] bp-640:grid-cols-1 bp-640:gap-[33px]"
			>
				{#each c.products.items as product, index (index)}{@const book = books[index % 3]}
					<article class="group" use:reveal={index * 80}>
						<div
							class="{matSurface} {book.art} relative grid h-[322px] place-items-center overflow-hidden rounded-[10px] [perspective:950px] before:pointer-events-none before:absolute before:inset-[7px] before:z-[-1] before:rounded-[inherit] before:border before:[box-shadow:0_1px_0_#00000012] before:content-[''] bp-850:h-[315px]"
						>
							{#if product.image}<img
									class="size-full object-contain"
									src={product.image}
									alt={product.imageAlt || product.title}
									loading="lazy"
								/>
							{:else}<div
									class="relative h-[220px] w-[158px] [transform:rotateX(8deg)_rotateY(-22deg)_rotateZ(-9deg)] [transform-style:preserve-3d] [transition:transform_0.7s_cubic-bezier(0.22,1,0.36,1)] group-hover:[transform:rotateX(2deg)_rotateY(-8deg)_rotateZ(-3deg)_translateY(-8px)] motion-reduce:group-hover:[transform:rotateX(8deg)_rotateY(-22deg)_rotateZ(-9deg)] bp-850:[scale:1]"
									role="img"
									aria-label={product.title}
								>
									<div
										class="{book.cover} absolute inset-0 flex [transform:translateZ(12px)] flex-col justify-between rounded-[2px] border-l border-l-[#ffffff7a] p-[18px] [box-shadow:9px_18px_18px_#21372c1c] [backface-visibility:hidden]"
									>
										<span class="font-[Arial] text-[7px]/[1.5] tracking-[0.6px]"
											>{c.products.coverLabel}</span
										><strong
											class="{book.title} font-display text-[49px] leading-[0.97] font-normal whitespace-pre-line"
											>{product.cover}</strong
										>
										<div
											class="flex items-end justify-between gap-2 font-[Arial] text-[7px]/[1.6] tracking-[0.5px]"
										>
											<span class="whitespace-pre-line">{c.products.coverNote}</span><span
												class="font-['Bebas_Neue',sans-serif] text-[20px] leading-[normal]"
												>{String(index + 1).padStart(2, '0')}</span
											>
										</div>
									</div>
									<div
										class="absolute top-[2px] right-[-11px] h-[216px] w-[23px] [transform:rotateY(90deg)] border-y-2 border-y-[#afc2bc] bg-[repeating-linear-gradient(90deg,#e7e8df_0px,#e7e8df_1px,#fff_1px,#fff_3px)]"
									></div>
									<div
										class="{book.spine} absolute top-0 left-[-11px] h-[220px] w-6 [transform:rotateY(90deg)]"
									></div>
								</div>
								<span
									class="{book.label} absolute right-4 bottom-[15px] font-[Arial] text-[0.5625rem]/[1.5] tracking-[1.4px]"
									>{c.products.placeholderLabel}</span
								>{/if}
						</div>
						<div class={storyMeta}>
							<span>{product.type}</span><span class={comingSoon}>{product.status}</span>
						</div>
						<h3>{product.title}</h3>
						<p class={cardCopy}>{product.copy}</p>
					</article>{/each}
			</div>
		</section>{/if}
{/snippet}

{#snippet appSection()}
	{#if c.app.enabled}<section
			class="{container} grid grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))] items-center gap-[35px] overflow-hidden rounded-[18px] bg-ink px-[72px] py-[65px] text-[#f7faf8] bp-1100:p-[52px] bp-850:gap-5 bp-850:px-[35px] bp-850:py-[45px] bp-640:grid-cols-1 bp-640:gap-[13px] bp-640:px-[27px] bp-640:py-9 cq-52:grid-cols-[minmax(0,1fr)]"
			aria-labelledby="app-title"
		>
			<div use:reveal>
				<p class="{eyebrowText} {eyebrowSpacing} text-[#bed4d7]">
					<span class="{statusDot} bg-cyan"></span>{c.app.eyebrow}
				</p>
				<h2 id="app-title" class="bp-850:text-[3rem] bp-640:text-[3.4375rem]">
					{c.app.heading.first}<br /><span class="text-cyan">{c.app.heading.accent}</span>
				</h2>
				<p
					class="mt-6 mb-[29px] text-[1rem] leading-[1.85] whitespace-pre-line text-[#b9cbcf] bp-850:text-[0.9375rem]"
				>
					{c.app.copy}
				</p>
				{#if c.app.ready}<a
						class={appButton}
						href={c.app.url}
						target="_blank"
						rel="noopener noreferrer"
						>{c.app.cta}{@render arrow()}<span class="sr-only">(opens in a new tab)</span></a
					>{:else}<span class={comingSoon}>{c.app.unavailable}</span>{/if}
			</div>
			<div
				class="group/art relative grid h-[360px] place-items-center [perspective:900px] bp-850:h-[320px] bp-640:h-[335px]"
				use:reveal={120}
			>
				{#if c.app.previewImage}<img
						class="size-full object-contain"
						src={c.app.previewImage}
						alt={c.app.previewAlt}
						loading="lazy"
					/>{:else}<div
						class="absolute size-[310px] rounded-[50%] border border-[#466068] after:absolute after:inset-7 after:rounded-[50%] after:border after:border-[#344d55] after:content-[''] bp-850:size-[260px] bp-640:size-[280px]"
						aria-hidden="true"
					></div>
					<div
						class="relative h-[355px] w-[182px] [transform:rotateY(-16deg)_rotateZ(10deg)] rounded-[26px] bg-[linear-gradient(110deg,#a0b4b5,#53686b_55%,#c3d7d7)] p-2 [box-shadow:16px_20px_35px_#0003] [transition:transform_0.7s_cubic-bezier(0.22,1,0.36,1)] group-hover/art:[transform:rotateY(-7deg)_rotateZ(4deg)_translateY(-5px)] motion-reduce:group-hover/art:[transform:rotateY(-16deg)_rotateZ(10deg)] bp-850:[scale:0.85] bp-640:[scale:0.9]"
						role="img"
						aria-label={c.app.previewAlt}
					>
						<div
							class="absolute top-[14px] left-1/2 z-[1] h-[10px] w-[52px] [transform:translateX(-50%)] rounded-[20px] bg-[#23383f]"
						></div>
						<div
							class="flex h-full flex-col items-start justify-between rounded-[20px] bg-[#e5f5f2] px-[18px] pt-[35px] pb-[17px] text-ink"
						>
							<span class="font-display text-[17px] font-normal tracking-[0.3px]"
								>{site.brand.wordmark}</span
							>
							<div
								class="relative block font-display text-[46px] leading-none font-normal"
								aria-hidden="true"
							>
								C<span
									class="absolute top-[2px] right-[-13px] font-[Arial] text-[24px] leading-[normal] text-cyan-ink"
									>↗</span
								>
							</div>
							<strong
								class="block font-display text-[32px] leading-[1.05] font-normal whitespace-pre-line"
								>{c.app.deviceHeading}</strong
							><span class="h-1 w-full rounded-[5px] bg-cyan"></span><small
								class="font-[Arial] text-[7px] leading-[normal] tracking-[0.6px] text-[#536c6c]"
								>{c.app.previewLabel}</small
							>
						</div>
					</div>{/if}
			</div>
		</section>{/if}
{/snippet}

{#snippet faqSection()}
	<FaqSection content={site.faq} />
{/snippet}

{#snippet contactSection()}
	<section
		id="contact"
		class="{container} {anchor} relative pt-[125px] pb-[115px] text-center bp-850:py-[80px]"
		aria-labelledby="contact-title"
	>
		<div
			class="absolute top-[76px] right-[-59px] size-[135px] [transform:rotateX(56deg)_rotateY(-24deg)] rounded-[50%] border-[24px] border-[#e8f3f0] opacity-90 bp-640:top-12 bp-640:right-[-55px] bp-640:size-[95px] bp-640:border-[18px]"
			aria-hidden="true"
		></div>
		<h2
			id="contact-title"
			class="relative text-[clamp(3.125rem,6vw,5.375rem)] bp-640:text-[clamp(2.875rem,9vw,3.875rem)]"
			use:reveal={60}
		>
			{c.contact.heading.first}<br /><span class={outlined}>{c.contact.heading.accent}</span>
		</h2>
		<p
			class="mx-auto mt-[26px] mb-[30px] max-w-[650px] text-[1rem] whitespace-pre-line bp-640:mt-[23px] bp-640:mb-[29px] bp-640:text-[0.9375rem]"
			use:reveal={100}
		>
			{c.contact.copy}
		</p>
		<div class="flex flex-col items-center gap-[17px]" use:reveal={150}>
			<a class={button} href={publicHref('/contact', data.preview)}
				>{c.contact.cta}{@render arrow()}</a
			><a
				class="inline-flex min-h-11 items-center font-[Arial] text-[0.8125rem]/[1.5] text-muted hover:text-cyan-ink"
				href={'mailto:' + site.brand.email}>{site.brand.email}</a
			>
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

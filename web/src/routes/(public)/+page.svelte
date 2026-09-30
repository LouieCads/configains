<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import FitnessScene from '$lib/components/landing/FitnessScene.svelte';
	import CoachingSection from '$lib/components/landing/CoachingSection.svelte';
	import { reveal } from '$lib/components/landing/motion';
	import '$lib/components/landing/landing.css';
	let { data }: { data: PageData } = $props();
	let menuOpen = $state(false);
	let menuButton: HTMLButtonElement;
	onMount(() => {
		const resize = new ResizeObserver(() => {
			if (menuOpen && !menuButton.getClientRects().length) menuOpen = false;
		});
		resize.observe(document.querySelector('.header-inner')!);
		return () => resize.disconnect();
	});
	const links = [
		['Home', 'home'],
		['About', 'about'],
		['Coaching', 'coaching'],
		['Transformations', 'transformations'],
		['Products', 'products']
	] as const;
	const services = [
		{
			number: '01',
			title: 'Train with purpose.',
			copy: 'A clear direction in the gym, built around your starting point, your schedule, and the equipment you have.',
			detail: 'Training that fits your goals',
			icon: 'training'
		},
		{
			number: '02',
			title: 'Eat for your life.',
			copy: 'Flexible nutrition guidance and everyday habits. Make room for the food you enjoy while working toward your goals.',
			detail: 'Practical nutrition support',
			icon: 'nutrition'
		},
		{
			number: '03',
			title: 'Keep moving forward.',
			copy: 'A coach to ask, a place to reflect, and support to find your next step when real life changes the plan.',
			detail: 'Support & accountability',
			icon: 'support'
		}
	];
	const products = [
		{
			type: 'E-BOOK',
			title: 'The foundations.',
			copy: 'A practical starting point for building better fitness habits.',
			cover: 'START\nSIMPLE.',
			className: 'book-cyan',
			number: '01'
		},
		{
			type: 'WORKOUT PLAN',
			title: 'A little more structure.',
			copy: 'A clear framework to bring purpose to your training.',
			cover: 'SHOW\nUP.',
			className: 'book-dark',
			number: '02'
		},
		{
			type: 'TEMPLATE',
			title: 'See your progress.',
			copy: 'Simple tools to help you reflect, plan, and stay consistent.',
			cover: 'KEEP\nGOING.',
			className: 'book-light',
			number: '03'
		}
	];
</script>

{#snippet arrow(direction = 'up')}
	<svg
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		aria-hidden="true"
		class:down={direction === 'down'}
		><path
			d="M6 18 18 6M6 6h12v12"
			stroke="currentColor"
			stroke-width="1.6"
			stroke-linecap="round"
			stroke-linejoin="round"
		/></svg
	>
{/snippet}
{#snippet serviceIcon(name: string)}
	<svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
		{#if name === 'training'}<path d="m7 21 14-14M4 18l10 10M18 4l10 10M3 23l6 6M23 3l6 6" />
		{:else if name === 'nutrition'}<path
				d="M17 10c-2-8 5-8 8-7-1 6-5 8-8 7ZM16 12c-5-4-12-1-12 6 0 5 4 11 9 10l3-1 3 1c5 1 9-5 9-10 0-7-7-10-12-6ZM16 12c0-4-2-6-4-7"
			/>
		{:else}<path d="M5 6h22v16H16l-7 5v-5H5V6ZM10 12h12M10 17h7" />{/if}
	</svg>
{/snippet}

<svelte:head>
	<title>Configains | Real Life. Real Progress.</title>
	<meta
		name="description"
		content="Build strength and confidence with Cash at Configains. Practical fitness coaching, flexible nutrition, and sustainable habits that fit your life."
	/>
	<meta property="og:title" content="Configains | Real Life. Real Progress." />
	<meta
		property="og:description"
		content="Practical fitness coaching with Cash. Build strength, confidence, and habits that fit your life."
	/>
	<meta property="og:type" content="website" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Coustard&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'Escape' && menuOpen) {
			menuOpen = false;
			menuButton?.focus();
		}
	}}
/>
<div class="landing" id="home">
	<a class="skip-link" href="#main-content">Skip to content</a>
	<header class="site-header">
		<div class="header-content container">
			<div class="header-inner">
				<a class="wordmark" href="#home" aria-label="Configains home"
					><span class="brand-symbol" aria-hidden="true">c<span>↗</span></span>CONFI<span
						class="brand-accent">GAINS</span
					><span class="brand-period">.</span></a
				>
				<nav class="desktop-nav" aria-label="Main navigation">
					{#each links as [label, id] (id)}<a href={'#' + id}>{label}</a>{/each}
				</nav>
				<a class="button button-dark small header-cta" href="#contact"
					>Let’s talk {@render arrow()}</a
				>
				<button
					class="menu-toggle"
					bind:this={menuButton}
					aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
					aria-expanded={menuOpen}
					aria-controls="mobile-nav"
					onclick={() => (menuOpen = !menuOpen)}
					>{menuOpen ? 'Close' : 'Menu'}<span aria-hidden="true">{menuOpen ? '−' : '+'}</span
					></button
				>
			</div>
			<nav
				id="mobile-nav"
				class="mobile-nav"
				class:open={menuOpen}
				aria-label="Mobile navigation"
				hidden={!menuOpen}
			>
				{#each [...links, ['Contact', 'contact']] as [label, id] (id)}<a
						href={'#' + id}
						onclick={() => (menuOpen = false)}>{label}{@render arrow()}</a
					>{/each}
			</nav>
		</div>
	</header>
	<main id="main-content">
		<section class="hero container" aria-labelledby="hero-title">
			<div class="hero-copy">
				<p class="eyebrow" use:reveal>
					<span class="status-dot"></span> ONLINE FITNESS COACHING WITH CASH
				</p>
				<h1 id="hero-title" use:reveal={70}>
					REAL LIFE.<br />REAL <span class="cyan-text">PROGRESS.</span>
				</h1>
				<p class="hero-intro" use:reveal={130}>
					A stronger you.<br />A life that still feels like yours.
				</p>
				<p class="hero-description" use:reveal={180}>
					Practical training. Flexible nutrition. A coach in your corner. Build habits that work for
					the long run.
				</p>
				<div class="hero-actions" use:reveal={230}>
					<a class="button" href="#contact">Find your starting point {@render arrow()}</a><a
						class="text-link"
						href="#coaching">Explore coaching {@render arrow('down')}</a
					>
				</div>
			</div>
			<div class="hero-visual" use:reveal={130}>
				<div class="visual-heading">
					<span>THE CONFIGAINS APPROACH</span><span class="plus" aria-hidden="true">+</span>
				</div>
				<div class="visual-statement" aria-hidden="true">A LITTLE<br /><span>STRONGER.</span></div>
				<div class="scene-wrap"><FitnessScene /></div>
			</div>
		</section>
		<div class="principles">
			<div class="container">
				<span>TRAIN WITH PURPOSE</span><i aria-hidden="true">✳</i><span>EAT LIKE A HUMAN</span><i
					aria-hidden="true">✳</i
				><span>SHOW UP FOR YOURSELF</span><i aria-hidden="true">✳</i><span
					>BUILD FOR THE LONG RUN</span
				>
			</div>
		</div>
		<section id="about" class="section about-grid container" aria-labelledby="about-title">
			<div class="coach-portrait" use:reveal>
				<div class="portrait-top">
					<span class="eyebrow">THE HUMAN BEHIND THE PLAN</span><span aria-hidden="true">↗</span>
				</div>
				<div
					class="portrait-placeholder"
					role="img"
					aria-label="Placeholder for coach Cash's portrait"
				>
					<span class="portrait-initial" aria-hidden="true">C.</span><span class="asset-label"
						>COACH PORTRAIT / COMING SOON</span
					>
				</div>
				<div class="portrait-bottom">
					<div><strong>Cash.</strong><span>YOUR COACH, IN YOUR CORNER.</span></div>
					<span class="portrait-seal" aria-hidden="true">REAL LIFE.<br />REAL PROGRESS.</span>
				</div>
			</div>
			<div class="about-copy" use:reveal={100}>
				<p class="eyebrow"><span class="section-number">01</span> MEET CONFIGAINS</p>
				<h2 id="about-title">
					COACHING WITH<br />A <span class="outlined-text">HUMAN</span> SIDE.
				</h2>
				<p class="section-intro">Hey, I’m Cash. Getting stronger should add to your life.</p>
				<p>
					Configains starts with where you are. Your goals, your schedule, the things you enjoy.
					Then we work on training, nutrition, and habits that make sense for you.
				</p>
				<div class="philosophy-note">
					<span aria-hidden="true">↗</span>
					<p>You don’t need a perfect routine.<br />You need one you can come back to.</p>
				</div>
				<a class="text-link" href="#coaching">Meet your next step {@render arrow()}</a>
			</div>
		</section>
		<CoachingSection {services} icon={serviceIcon} />
		<section id="transformations" class="section container" aria-labelledby="transformations-title">
			<div class="section-heading" use:reveal>
				<div>
					<p class="eyebrow"><span class="section-number">03</span> PROGRESS IN PRACTICE</p>
					<h2 id="transformations-title">
						REAL WORK.<br />PERSONAL <span class="outlined-text">PROGRESS.</span>
					</h2>
				</div>
			</div>
			<div class="transformation-grid">
				{#if data.transformations.length}{#each data.transformations as item, i (item.id)}<article
							class="transformation-card"
							use:reveal={i * 80}
						>
							<div class="comparison">
								{#each [['Before', item.before_image_url], ['After', item.after_image_url]] as [label, src] (label)}<div
										class="comparison-photo"
									>
										{#if src}<img
												{src}
												alt={`${item.title} — ${label}`}
												loading="lazy"
											/>{:else}<span class="image-placeholder"
												><svg viewBox="0 0 40 40" fill="none" aria-hidden="true"
													><rect x="5" y="7" width="30" height="26" rx="3" /><path
														d="m6 28 10-10 8 8 5-5 6 6"
													/><circle cx="27" cy="15" r="3" /></svg
												><span>Photo coming soon</span></span
											>{/if}<span class="image-label">{label}</span>
									</div>{/each}
							</div>
							<h3>{item.title}</h3>
							{#if item.summary}<p>{item.summary}</p>{/if}
						</article>{/each}
				{:else}{#each ['Building strength', 'Finding consistency', 'Growing confidence'] as title, i (title)}<article
							class="transformation-card"
							use:reveal={i * 80}
						>
							<div class="comparison">
								{#each ['Before', 'After'] as label (label)}<div
										class="comparison-photo"
										class:after={label === 'After'}
									>
										<span class="image-placeholder"
											><svg viewBox="0 0 40 40" fill="none" aria-hidden="true"
												><rect x="5" y="7" width="30" height="26" rx="3" /><path
													d="m6 28 10-10 8 8 5-5 6 6"
												/><circle cx="27" cy="15" r="3" /></svg
											><span>Photo coming soon</span></span
										><span class="image-label">{label}</span>
									</div>{/each}
							</div>
							<div class="story-meta">
								<span>JOURNEY 0{i + 1}</span><span class="coming-soon">COMING SOON</span>
							</div>
							<h3>{title}</h3>
							<p>A real client’s journey will go here, shared with their permission.</p>
						</article>{/each}{/if}
			</div>
		</section>
		<section class="testimonial-section" aria-labelledby="testimonials-title">
			<div class="testimonial-layout container">
				<div use:reveal>
					<p class="eyebrow"><span class="section-number">04</span> THE COMMUNITY</p>
					<h2 id="testimonials-title">
						THEIR JOURNEY.<br />THEIR <span class="outlined-text">WORDS.</span>
					</h2>
					<p>Honest feedback from the people doing the work.</p>
				</div>
				<div class="testimonial-content" use:reveal={100}>
					{#if data.testimonials.length}{#each data.testimonials as testimonial (testimonial.id)}<blockquote
							>
								<span class="quote-mark" aria-hidden="true">“</span>
								<p>{testimonial.quote}</p>
								<footer>
									{testimonial.name}{#if testimonial.role}<span> / {testimonial.role}</span>{/if}
								</footer>
							</blockquote>{/each}
					{:else}<div class="testimonial-placeholder">
							<span class="quote-mark" aria-hidden="true">“</span>
							<p>Good progress deserves<br />an honest story.</p>
							<div class="testimonial-status">
								<span class="status-dot"></span> CLIENT STORIES COMING SOON
							</div>
							<span class="testimonial-hint"
								>Reserved for real feedback from the Configains community.</span
							>
						</div>{/if}
				</div>
			</div>
		</section>
		<section id="products" class="section container" aria-labelledby="products-title">
			<div class="section-heading" use:reveal>
				<div>
					<p class="eyebrow"><span class="section-number">05</span> YOUR EVERYDAY TOOLKIT</p>
					<h2 id="products-title">
						A LITTLE STRUCTURE.<br />A STEP <span class="outlined-text">FORWARD.</span>
					</h2>
				</div>
			</div>
			<div class="product-grid">
				{#each products as product, i (product.number)}<article
						class="product-card"
						use:reveal={i * 80}
					>
						<div
							class="product-art {product.className}"
							role="img"
							aria-label={`Placeholder cover for ${product.type.toLowerCase()}`}
						>
							<div class="book-3d">
								<div class="book-cover">
									<span>CONFIGAINS / THE TOOLKIT</span><strong>{product.cover}</strong>
									<div>
										<span>A LITTLE STRUCTURE.<br />A STEP FORWARD.</span><span
											>{product.number}</span
										>
									</div>
								</div>
								<div class="book-pages"></div>
								<div class="book-spine"></div>
							</div>
							<span class="asset-label">COVER PLACEHOLDER</span>
						</div>
						<div class="story-meta">
							<span>{product.type}</span><span class="coming-soon">COMING SOON</span>
						</div>
						<h3>{product.title}</h3>
						<p>{product.copy}</p>
					</article>{/each}
			</div>
		</section>
		<section class="app-section container" aria-labelledby="app-title">
			<div class="app-copy" use:reveal>
				<p class="eyebrow"><span class="status-dot"></span> YOUR NEXT STEP, ONLINE</p>
				<h2 id="app-title">YOUR PROGRESS.<br /><span>YOUR SPACE.</span></h2>
				<p>Meet the Configains app.<br />A dedicated space for the next part of your journey.</p>
				<a class="button" href="https://configains.app" target="_blank" rel="noopener noreferrer"
					>Explore configains.app {@render arrow()}<span class="sr-only">
						(opens in a new tab)</span
					></a
				>
			</div>
			<div
				class="app-art"
				use:reveal={120}
				role="img"
				aria-label="Placeholder preview of the Configains app"
			>
				<div class="app-orbit" aria-hidden="true"></div>
				<div class="app-device">
					<div class="device-camera"></div>
					<div class="device-screen">
						<span class="device-wordmark">CONFIGAINS.</span>
						<div class="app-mark" aria-hidden="true">C<span>↗</span></div>
						<strong>A LITTLE<br />STRONGER.<br /><span>EVERY DAY.</span></strong><span
							class="device-rule"
						></span><small>APP PREVIEW PLACEHOLDER</small>
					</div>
				</div>
			</div>
		</section>
		<section id="contact" class="section contact-section container" aria-labelledby="contact-title">
			<div class="contact-orbit" aria-hidden="true"></div>
			<p class="eyebrow" use:reveal><span class="status-dot"></span> START WHERE YOU ARE</p>
			<h2 id="contact-title" use:reveal={60}>
				YOUR NEXT CHAPTER.<br /><span class="outlined-text">LET’S FIGURE IT OUT.</span>
			</h2>
			<p use:reveal={100}>
				Tell me a little about yourself and what you’re working toward.<br />We’ll find a starting
				point, together.
			</p>
			<div class="contact-actions" use:reveal={150}>
				<a class="button" href="mailto:hello@configains.com?subject=Coaching%20inquiry"
					>Let’s talk about coaching {@render arrow()}</a
				><a class="email-link" href="mailto:hello@configains.com">hello@configains.com</a>
			</div>
		</section>
	</main>
	<footer class="landing-footer">
		<div class="footer-top container">
			<a class="wordmark" href="#home"
				>CONFI<span class="brand-accent">GAINS</span><span class="brand-period">.</span></a
			>
			<p>Real life. Real progress.</p>
			<a class="text-link" href="#home">Back to top {@render arrow()}</a>
		</div>
		<div class="footer-bottom container">
			<span>© {new Date().getFullYear()} Configains</span>
			<nav aria-label="Footer navigation">
				<a href="#about">About</a><a href="#coaching">Coaching</a><a href="#contact">Contact</a><a
					href="https://configains.app"
					target="_blank"
					rel="noopener noreferrer"
					>Configains app ↗<span class="sr-only"> (opens in a new tab)</span></a
				>
			</nav>
			<span>Built for the long run.</span>
		</div>
	</footer>
</div>

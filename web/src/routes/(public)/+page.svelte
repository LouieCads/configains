<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	let menuOpen = $state(false);
	const links = [
		['About', 'about'],
		['Coaching', 'coaching'],
		['Transformations', 'transformations'],
		['Products', 'products']
	] as const;
	const services = [
		{
			number: '01',
			title: 'Training with purpose.',
			copy: 'A clear direction in the gym, built around your starting point, your schedule, and the equipment you have.',
			detail: 'Practical training guidance',
			icon: '↗'
		},
		{
			number: '02',
			title: 'Nutrition for real life.',
			copy: 'Build a better relationship with food through flexible habits that fit your everyday life.',
			detail: 'Sustainable nutrition habits',
			icon: '◉'
		},
		{
			number: '03',
			title: 'Someone in your corner.',
			copy: 'A place to ask questions, reflect on your progress, and find a way forward when life gets busy.',
			detail: 'Support & accountability',
			icon: '↔'
		}
	];
	const products = [
		{
			type: 'E-BOOK',
			title: 'The foundations.',
			copy: 'A practical starting point for building better fitness habits.',
			cover: 'START\nSIMPLE.',
			className: 'book-cyan'
		},
		{
			type: 'TRAINING PLAN',
			title: 'A little more structure.',
			copy: 'A clear framework to bring purpose to your training.',
			cover: 'SHOW\nUP.',
			className: 'book-dark'
		},
		{
			type: 'TEMPLATE',
			title: 'See your progress.',
			copy: 'Simple tools to help you reflect, plan, and stay consistent.',
			cover: 'KEEP\nGOING.',
			className: 'book-sand'
		}
	];
</script>

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

<div class="landing" id="home">
	<a class="skip-link" href="#main-content">Skip to content</a>
	<header class="site-header">
		<div class="header-inner container">
			<a class="wordmark" href="#home" aria-label="Configains home"
				>CONFI<span>GAINS</span><span class="brand-dot">®</span></a
			>
			<nav class="desktop-nav" aria-label="Main navigation">
				{#each links as [label, id]}<a href={'#' + id}>{label}</a>{/each}
			</nav>
			<a class="button small header-cta" href="#contact"
				>Let’s talk <span aria-hidden="true">↗</span></a
			>
			<button
				class="menu-toggle"
				aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
				aria-expanded={menuOpen}
				aria-controls="mobile-nav"
				onclick={() => (menuOpen = !menuOpen)}>{menuOpen ? 'Close −' : 'Menu +'}</button
			>
		</div>
		{#if menuOpen}
			<nav id="mobile-nav" class="mobile-nav" aria-label="Mobile navigation">
				{#each [...links, ['Contact', 'contact']] as [label, id]}<a
						href={'#' + id}
						onclick={() => (menuOpen = false)}>{label}<span aria-hidden="true">↗</span></a
					>{/each}
			</nav>
		{/if}
	</header>
	<main id="main-content">
		<section class="hero container" aria-labelledby="hero-title">
			<div class="hero-copy">
				<p class="eyebrow"><span class="dot"></span> ONLINE COACHING. HUMAN APPROACH.</p>
				<h1 id="hero-title">
					REAL LIFE.<br />REAL
					<span class="accent-word"
						>PROGRESS.<svg viewBox="0 0 450 16" preserveAspectRatio="none" aria-hidden="true"
							><path d="M3 10 Q200 0 446 8 M35 15 Q245 7 419 13" /></svg
						></span
					>
				</h1>
				<p class="intro">Build a stronger you.<br />Without putting your life on hold.</p>
				<p class="hero-description">
					Practical training, flexible nutrition, and a coach in your corner. Let’s make progress
					that feels like you.
				</p>
				<div class="hero-actions">
					<a class="button" href="#contact"
						>Find your starting point <span aria-hidden="true">↗</span></a
					><a class="text-link" href="#coaching"
						>Explore coaching <span aria-hidden="true">↓</span></a
					>
				</div>
				<div class="hero-note">
					<span aria-hidden="true">✓</span> Your goals. Your pace. A plan that fits.
				</div>
			</div>
			<div class="hero-visual">
				<div
					class="photo-placeholder hero-photo"
					role="img"
					aria-label="Placeholder for a photo of Cash coaching"
				>
					<div class="photo-top"><span>THE EVERYDAY WORK</span><span>01 / 01</span></div>
					<div class="placeholder-center">
						<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"
							><rect x="8" y="12" width="48" height="40" rx="2" /><circle
								cx="24"
								cy="26"
								r="5"
							/><path d="m9 46 16-14 12 11 9-8 10 9" /></svg
						><span>COACH / TRAINING PHOTO</span><small>Image placeholder</small>
					</div>
					<div class="photo-bottom">
						<span>CONFIGAINS / COACHING</span><span aria-hidden="true">↗</span>
					</div>
				</div>
				<div class="coach-tag">
					<span class="tag-icon" aria-hidden="true">↗</span>
					<div>
						<strong>Less guesswork.<br />More showing up.</strong><small
							>That’s the Configains approach.</small
						>
					</div>
				</div>
				<span class="vertical-note">BUILT AROUND YOUR LIFE, NOT THE OTHER WAY AROUND.</span>
			</div>
		</section>
		<div class="principles">
			<div class="container">
				<span>STRENGTH WITH PURPOSE</span><i aria-hidden="true">✳</i><span>FOOD WITHOUT FEAR</span
				><i aria-hidden="true">✳</i><span>CONSISTENCY OVER PERFECTION</span><i aria-hidden="true"
					>✳</i
				><span>PROGRESS THAT LASTS</span>
			</div>
		</div>
		<section id="about" class="section about-grid container">
			<div
				class="about-photo photo-placeholder"
				role="img"
				aria-label="Placeholder for Cash's portrait"
			>
				<span class="corner-label">MEET YOUR COACH</span>
				<div class="placeholder-center">
					<span class="portrait-mark" aria-hidden="true">C.</span><span>COACH CASH PORTRAIT</span
					><small>Image placeholder</small>
				</div>
				<span class="portrait-caption">Cash / The human behind Configains</span>
			</div>
			<div class="about-copy">
				<p class="eyebrow">01 / A LITTLE ABOUT CONFIGAINS</p>
				<h2>A COACH.<br />A PLAN.<br /><span class="muted-heading">YOUR REAL LIFE.</span></h2>
				<p>
					Hey, I’m Cash. Configains is built around a simple idea: getting stronger should add to
					your life.
				</p>
				<p>
					We start with where you are. Then we work on training, nutrition, and everyday habits that
					make sense for you. One manageable step at a time.
				</p>
				<div class="handwritten-note">
					You don’t need a perfect routine.<br />You need one you can keep coming back to.
				</div>
				<a class="text-link" href="#coaching"
					>Get to know the approach <span aria-hidden="true">↗</span></a
				>
			</div>
		</section>
		<section id="coaching" class="coaching-section section">
			<div class="container">
				<div class="section-heading">
					<div>
						<p class="eyebrow">02 / HOW WE WORK TOGETHER</p>
						<h2>LESS OVERWHELM.<br />MORE DIRECTION.</h2>
					</div>
					<p>Simple foundations. Thoughtful support.<br />Coaching that meets you where you are.</p>
				</div>
				<div class="service-grid">
					{#each services as service}<article class="service-card">
							<div class="service-top">
								<span>{service.number}</span><span class="service-icon" aria-hidden="true"
									>{service.icon}</span
								>
							</div>
							<h3>{service.title}</h3>
							<p>{service.copy}</p>
							<div class="service-detail"><span aria-hidden="true">✓</span>{service.detail}</div>
						</article>{/each}
				</div>
				<div class="coaching-bottom">
					<p>You bring the starting point. We’ll figure out the next step.</p>
					<a class="text-link" href="#contact"
						>Let’s talk about your goals <span aria-hidden="true">↗</span></a
					>
				</div>
			</div>
		</section>
		<section id="transformations" class="section container">
			<div class="section-heading">
				<div>
					<p class="eyebrow">03 / PROGRESS, IN PRACTICE</p>
					<h2>EVERY JOURNEY<br />STARTS SOMEWHERE.</h2>
				</div>
				<p>More than a before and after.<br />The habits, confidence, and work in between.</p>
			</div>
			<div class="transformation-grid">
				{#if data.transformations.length}
					{#each data.transformations as item (item.id)}<article class="transformation-card">
							<div class="comparison">
								{#each [['Before', item.before_image_url], ['After', item.after_image_url]] as [label, src]}<div
										class="comparison-photo photo-placeholder"
									>
										{#if src}<img
												{src}
												alt={`${item.title} — ${label}`}
												loading="lazy"
											/>{:else}<span>Photo coming soon</span>{/if}<span class="image-label"
											>{label}</span
										>
									</div>{/each}
							</div>
							<h3>{item.title}</h3>
							{#if item.summary}<p>{item.summary}</p>{/if}
						</article>{/each}
				{:else}
					{#each ['Building strength', 'Finding consistency', 'Growing confidence'] as title, i}<article
							class="transformation-card"
						>
							<div class="comparison">
								<div class="comparison-photo photo-placeholder">
									<span class="outline-person" aria-hidden="true">○<br />╱│╲</span><span
										class="image-label">BEFORE</span
									>
								</div>
								<div class="comparison-photo photo-placeholder after">
									<span class="outline-person" aria-hidden="true">○<br />╱│╲</span><span
										class="image-label">AFTER</span
									>
								</div>
							</div>
							<div class="story-meta">
								<span>CLIENT STORY / 0{i + 1}</span><span>COMING SOON</span>
							</div>
							<h3>{title}</h3>
							<p>Space for a real client’s photos and story, shared with their permission.</p>
						</article>{/each}
				{/if}
			</div>
		</section>
		<section class="testimonial-section section" aria-labelledby="testimonials-title">
			<div class="testimonial-layout container">
				<div>
					<p class="eyebrow">04 / WORDS FROM THE COMMUNITY</p>
					<h2 id="testimonials-title">REAL PEOPLE.<br />THEIR OWN WORDS.</h2>
				</div>
				<div>
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
							<span class="eyebrow">CLIENT TESTIMONIALS COMING SOON</span><small
								>This space is reserved for real feedback from the Configains community.</small
							>
						</div>{/if}
				</div>
			</div>
		</section>
		<section id="products" class="section container">
			<div class="section-heading">
				<div>
					<p class="eyebrow">05 / TOOLS FOR YOUR NEXT STEP</p>
					<h2>A LITTLE GUIDANCE.<br />AT YOUR OWN PACE.</h2>
				</div>
				<p>Practical resources to support the work.<br />The first collection is on its way.</p>
			</div>
			<div class="product-grid">
				{#each products as product}<article class="product-card">
						<div
							class="product-art {product.className}"
							role="img"
							aria-label={`Placeholder cover for ${product.type.toLowerCase()}`}
						>
							<div class="book">
								<span>CONFIGAINS® / THE TOOLKIT</span><strong>{product.cover}</strong><span
									>A LITTLE STRUCTURE.<br />A STEP FORWARD.</span
								>
							</div>
							<span class="asset-label">COVER PLACEHOLDER</span>
						</div>
						<div class="story-meta"><span>{product.type}</span><span>COMING SOON</span></div>
						<h3>{product.title}</h3>
						<p>{product.copy}</p>
					</article>{/each}
			</div>
		</section>
		<section class="app-section container">
			<div>
				<p class="eyebrow">YOUR NEXT STEP, ONLINE</p>
				<h2>MEET THE<br />CONFIGAINS APP.</h2>
				<p>A dedicated space for the next part of your journey.</p>
				<a class="button" href="https://configains.app" target="_blank" rel="noopener noreferrer"
					>Explore configains.app <span aria-hidden="true">↗</span><span class="sr-only">
						(opens in a new tab)</span
					></a
				>
			</div>
			<div class="app-art" role="img" aria-label="Placeholder for a Configains app screenshot">
				<div class="app-window">
					<div class="window-bar"><span>● ● ●</span><span>CONFIGAINS.APP</span><span>↗</span></div>
					<div class="app-placeholder">
						<span class="app-logo">C<span>↗</span></span><span>YOUR PROGRESS.<br />YOUR SPACE.</span
						><small>App preview placeholder</small>
					</div>
				</div>
			</div>
		</section>
		<section id="contact" class="section contact-section container">
			<p class="eyebrow"><span class="dot"></span> START WHERE YOU ARE</p>
			<h2>YOUR NEXT CHAPTER.<br /><span class="muted-heading">LET’S FIGURE IT OUT.</span></h2>
			<p>
				Tell me a little about yourself and what you’re working toward.<br />We’ll find a starting
				point, together.
			</p>
			<a class="button" href="mailto:hello@configains.com?subject=Coaching%20inquiry"
				>Let’s talk about coaching <span aria-hidden="true">↗</span></a
			><a class="email-link" href="mailto:hello@configains.com">hello@configains.com</a>
		</section>
	</main>
	<footer class="landing-footer">
		<div class="footer-top container">
			<a class="wordmark" href="#home">CONFI<span>GAINS</span><span class="brand-dot">®</span></a>
			<p>Real life. Real progress.</p>
			<a class="text-link" href="#home">Back to top <span aria-hidden="true">↑</span></a>
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

<style>
	.landing {
		--paper: #f7f6f2;
		--ink: #232725;
		--cyan: #61d7e8;
		--muted: #68706b;
		background: var(--paper);
		color: var(--ink);
		font-family: 'Coustard', Georgia, serif;
		font-size: 16px;
		line-height: 1.7;
	}
	.container {
		width: min(1240px, calc(100% - 96px));
		margin-inline: auto;
	}
	.section {
		padding-block: 110px;
	}
	.landing :global(*) {
		box-sizing: border-box;
	}
	.landing :global(a) {
		text-decoration: none;
	}
	.landing :global(a:focus-visible),
	button:focus-visible {
		outline: 3px solid #128596;
		outline-offset: 6px;
	}
	.landing :global(section[id]) {
		scroll-margin-top: 32px;
	}
	h1,
	h2,
	h3,
	p {
		margin: 0;
	}
	h1,
	h2,
	.wordmark,
	.principles,
	.book strong,
	.app-placeholder > span,
	.portrait-mark {
		font-family: 'Bebas Neue', 'Arial Narrow', Impact, sans-serif;
		font-weight: 400;
	}
	h1 {
		font-size: clamp(76px, 7.7vw, 112px);
		line-height: 0.98;
		letter-spacing: -1px;
	}
	h2 {
		font-size: clamp(48px, 5vw, 68px);
		line-height: 1.04;
	}
	h3 {
		font-size: 21px;
		line-height: 1.4;
		font-weight: 400;
	}
	p {
		color: var(--muted);
	}
	.eyebrow {
		font:
			600 12px/1.6 Arial,
			sans-serif;
		letter-spacing: 1.7px;
		color: var(--ink);
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 24px;
	}
	.dot {
		width: 7px;
		height: 7px;
		background: #238e9e;
		border-radius: 50%;
		display: inline-block;
	}
	.muted-heading {
		color: #878c83;
	}
	.site-header {
		border-bottom: 1px solid #dcded7;
	}
	.header-inner {
		height: 100px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 32px;
	}
	.wordmark {
		font-size: 33px;
		line-height: 1;
		letter-spacing: -0.8px;
		white-space: nowrap;
	}
	.wordmark > span:first-child {
		color: #288393;
	}
	.brand-dot {
		font: 12px Arial;
		vertical-align: top;
		margin-left: 3px;
	}
	.desktop-nav {
		display: flex;
		gap: 29px;
		font:
			14px Arial,
			sans-serif;
	}
	.desktop-nav a:hover,
	.footer-bottom a:hover {
		color: #257d8a;
	}
	.button {
		display: inline-flex;
		align-items: center;
		justify-content: space-between;
		gap: 34px;
		background: var(--cyan);
		color: var(--ink);
		padding: 17px 23px;
		font:
			600 14px/1.4 Arial,
			sans-serif;
		border: 1px solid transparent;
		transition:
			background 0.2s,
			transform 0.2s;
	}
	.button:hover {
		background: #83e3ef;
		transform: translateY(-2px);
	}
	.button span[aria-hidden] {
		font-size: 22px;
		line-height: 1;
	}
	.button.small {
		padding: 13px 19px;
		gap: 27px;
	}
	.text-link {
		display: inline-flex;
		align-items: center;
		gap: 18px;
		font:
			600 14px/1.5 Arial,
			sans-serif;
		border-bottom: 1px solid #737970;
		padding-bottom: 4px;
	}
	.text-link:hover {
		color: #257d8a;
		border-color: #257d8a;
	}
	.menu-toggle {
		display: none;
	}
	.mobile-nav {
		padding: 0 24px 24px;
	}
	.mobile-nav a {
		display: flex;
		justify-content: space-between;
		padding: 12px 0;
		border-top: 1px solid #d6dbd3;
	}
	.skip-link {
		position: absolute;
		top: -100px;
		left: 16px;
		background: var(--cyan);
		padding: 12px;
		z-index: 20;
	}
	.skip-link:focus {
		top: 10px;
	}
	.hero {
		display: grid;
		grid-template-columns: 1.12fr 1fr;
		gap: 56px;
		padding-block: 78px 88px;
		align-items: center;
	}
	.hero .eyebrow {
		margin-bottom: 29px;
	}
	.accent-word {
		position: relative;
		display: inline-block;
	}
	.accent-word svg {
		position: absolute;
		bottom: -10px;
		left: 0;
		width: 100%;
		height: 13px;
		fill: none;
		stroke: var(--cyan);
		stroke-width: 5;
	}
	.intro {
		font-size: 22px;
		line-height: 1.55;
		margin-top: 33px;
		color: var(--ink);
	}
	.hero-description {
		max-width: 410px;
		font-size: 15px;
		margin-top: 18px;
		line-height: 1.9;
	}
	.hero-actions {
		display: flex;
		align-items: center;
		gap: 25px;
		margin-top: 29px;
		flex-wrap: wrap;
	}
	.hero-note {
		font:
			12px Arial,
			sans-serif;
		color: var(--muted);
		margin-top: 27px;
	}
	.hero-note span {
		margin-right: 7px;
	}
	.hero-visual {
		position: relative;
		padding: 0 22px 30px 0;
	}
	.photo-placeholder {
		background: #e2e4dc;
		position: relative;
		overflow: hidden;
	}
	.hero-photo {
		height: 530px;
		background: linear-gradient(125deg, #e6e8df, #d6dbd0);
	}
	.photo-top,
	.photo-bottom {
		display: flex;
		justify-content: space-between;
		position: absolute;
		left: 23px;
		right: 23px;
		font:
			10px Arial,
			sans-serif;
		letter-spacing: 1px;
		color: #646e61;
	}
	.photo-top {
		top: 24px;
	}
	.photo-bottom {
		bottom: 20px;
		align-items: center;
	}
	.photo-bottom > span:last-child {
		font-size: 24px;
	}
	.placeholder-center {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		gap: 13px;
		font:
			11px Arial,
			sans-serif;
		letter-spacing: 1.5px;
		color: #586453;
	}
	.placeholder-center svg {
		width: 50px;
		stroke: #87957e;
		stroke-width: 1;
	}
	.placeholder-center small {
		font:
			12px Arial,
			sans-serif;
		letter-spacing: 0;
		color: #67715f;
	}
	.coach-tag {
		position: absolute;
		bottom: 5px;
		left: -25px;
		background: var(--paper);
		padding: 20px 25px;
		display: flex;
		gap: 19px;
		align-items: center;
		box-shadow: 0 4px 25px #2327250a;
		border: 1px solid #e0e3da;
	}
	.tag-icon {
		width: 44px;
		height: 44px;
		background: var(--cyan);
		display: grid;
		place-items: center;
		font: 26px Arial;
	}
	.coach-tag strong {
		font-size: 17px;
		font-weight: 400;
		line-height: 1.4;
		display: block;
	}
	.coach-tag small {
		display: block;
		font: 11px Arial;
		color: var(--muted);
		margin-top: 8px;
	}
	.vertical-note {
		position: absolute;
		right: -9px;
		top: 25px;
		writing-mode: vertical-rl;
		font: 9px Arial;
		letter-spacing: 1.5px;
		color: var(--muted);
	}
	.principles {
		border-block: 1px solid #dcded7;
	}
	.principles > .container {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 22px;
		padding-block: 22px;
		font-size: 20px;
		letter-spacing: 0.6px;
	}
	.principles i {
		font: 24px Arial;
		color: #2692a0;
	}
	.about-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 112px;
		align-items: center;
	}
	.about-photo {
		height: 520px;
		background: #e8e5dd;
	}
	.corner-label {
		position: absolute;
		top: 22px;
		left: 24px;
		font: 10px Arial;
		letter-spacing: 1.5px;
	}
	.portrait-mark {
		font-size: 150px;
		line-height: 1;
		color: #bfc3b5;
	}
	.portrait-caption {
		position: absolute;
		bottom: 22px;
		left: 24px;
		right: 20px;
		font-size: 12px;
		color: #687060;
	}
	.about-copy > p:not(.eyebrow) {
		margin-top: 24px;
		font-size: 15px;
	}
	.handwritten-note {
		border-left: 3px solid var(--cyan);
		padding-left: 20px;
		margin: 27px 0;
		font-size: 17px;
		line-height: 1.7;
	}
	.about-copy .text-link {
		margin-top: 5px;
	}
	.coaching-section {
		background: #edeee8;
	}
	.section-heading {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 45px;
		margin-bottom: 45px;
	}
	.section-heading > p {
		font-size: 14px;
		line-height: 1.9;
		max-width: 340px;
		padding-bottom: 5px;
	}
	.service-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 22px;
	}
	.service-card {
		border: 1px solid #d7dad1;
		padding: 30px;
		background: var(--paper);
	}
	.service-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 39px;
		font: 12px Arial;
		color: #78816f;
	}
	.service-icon {
		font: 35px Arial;
		color: #368795;
	}
	.service-card > p {
		font-size: 14px;
		margin-top: 19px;
		line-height: 1.9;
	}
	.service-detail {
		border-top: 1px solid #dcdfd6;
		margin-top: 28px;
		padding-top: 21px;
		font: 12px Arial;
	}
	.service-detail span {
		color: #268795;
		margin-right: 10px;
	}
	.coaching-bottom {
		display: flex;
		justify-content: space-between;
		gap: 25px;
		align-items: center;
		margin-top: 31px;
	}
	.coaching-bottom p {
		font-size: 13px;
	}
	.transformation-grid,
	.product-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 28px;
	}
	.comparison {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 3px;
	}
	.comparison-photo {
		height: 280px;
		display: grid;
		place-items: center;
		font: 12px Arial;
		color: var(--muted);
	}
	.comparison-photo.after {
		background: #d7dfd4;
	}
	.comparison-photo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		position: absolute;
		inset: 0;
	}
	.outline-person {
		font: 60px/1.1 Arial;
		color: #b4bcae;
		text-align: center;
	}
	.image-label {
		position: absolute;
		bottom: 13px;
		left: 13px;
		background: #f7f6f2df;
		padding: 5px 8px;
		font: 10px Arial;
		letter-spacing: 1px;
		color: var(--ink);
	}
	.story-meta {
		display: flex;
		justify-content: space-between;
		gap: 10px;
		font: 9px Arial;
		letter-spacing: 1px;
		color: var(--muted);
		margin: 21px 0 12px;
	}
	.transformation-card > p,
	.product-card > p {
		font-size: 13px;
		margin-top: 10px;
		line-height: 1.9;
	}
	.transformation-card > h3 {
		margin-top: 18px;
	}
	.testimonial-section {
		background: #ddeef0;
	}
	.testimonial-layout {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 95px;
	}
	.testimonial-placeholder,
	.testimonial-layout blockquote {
		margin: 0;
		position: relative;
		padding-top: 20px;
	}
	.quote-mark {
		font: 88px/0.6 Georgia;
		color: #56929a;
		display: block;
		margin-bottom: 20px;
	}
	.testimonial-placeholder > p,
	.testimonial-layout blockquote > p {
		font-size: 25px;
		color: var(--ink);
		line-height: 1.6;
	}
	.testimonial-placeholder > .eyebrow {
		margin: 29px 0 10px;
		font-size: 10px;
		letter-spacing: 1.2px;
	}
	.testimonial-placeholder > small {
		display: block;
		font-size: 12px;
		color: #596e6a;
		max-width: 350px;
	}
	.testimonial-layout blockquote footer {
		font: 13px Arial;
		margin-top: 20px;
	}
	.testimonial-layout blockquote + blockquote {
		margin-top: 35px;
		border-top: 1px solid #bcd6d7;
		padding-top: 30px;
	}
	.product-art {
		height: 310px;
		display: grid;
		place-items: center;
		position: relative;
		overflow: hidden;
		background: #dce7e2;
	}
	.book {
		width: 155px;
		height: 224px;
		padding: 19px 19px 17px 23px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		transform: rotate(-9deg);
		box-shadow:
			7px 12px 0 #23272515,
			14px 18px 20px #23272515;
		border-left: 4px solid #23272525;
	}
	.book > span {
		font: 7px/1.7 Arial;
		letter-spacing: 0.7px;
	}
	.book strong {
		font-size: 48px;
		white-space: pre-line;
		line-height: 1;
	}
	.book-cyan .book {
		background: var(--cyan);
	}
	.book-dark {
		background: #e3e3dd;
	}
	.book-dark .book {
		background: #2e3933;
		color: #eff2e8;
		transform: rotate(6deg);
	}
	.book-dark .book strong {
		color: var(--cyan);
	}
	.book-sand {
		background: #e9e4db;
	}
	.book-sand .book {
		background: #e7d9b6;
		transform: rotate(-6deg);
	}
	.asset-label {
		position: absolute;
		bottom: 12px;
		right: 12px;
		font: 9px Arial;
		letter-spacing: 1px;
		color: #627365;
	}
	.app-section {
		background: #273830;
		color: #f3f4ec;
		padding: 64px 65px;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 60px;
		overflow: hidden;
	}
	.app-section .eyebrow {
		color: #a8c9bc;
	}
	.app-section p:not(.eyebrow) {
		color: #c4d0c6;
		font-size: 14px;
		max-width: 330px;
		margin: 22px 0 28px;
	}
	.app-art {
		display: flex;
		align-items: center;
		transform: translate(20px, 25px) rotate(-5deg);
	}
	.app-window {
		width: 100%;
		height: 305px;
		background: #f1f2e9;
		border: 7px solid #536357;
		border-radius: 8px;
		box-shadow: 0 12px 35px #0003;
	}
	.window-bar {
		display: flex;
		justify-content: space-between;
		padding: 12px 15px;
		border-bottom: 1px solid #d6dacd;
		color: #647660;
		font: 8px Arial;
		letter-spacing: 1px;
	}
	.app-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 250px;
		color: var(--ink);
		text-align: center;
		gap: 15px;
	}
	.app-placeholder > span {
		font-size: 35px;
		line-height: 1.1;
	}
	.app-placeholder .app-logo {
		font-size: 52px;
	}
	.app-logo span {
		color: #3198a1;
	}
	.app-placeholder small {
		font: 10px Arial;
		color: #63715e;
	}
	.contact-section {
		text-align: center;
		padding-block: 112px;
	}
	.contact-section .eyebrow {
		justify-content: center;
	}
	.contact-section h2 {
		font-size: clamp(56px, 6vw, 82px);
	}
	.contact-section p:not(.eyebrow) {
		font-size: 15px;
		margin: 26px 0;
	}
	.contact-section .button {
		margin-top: 7px;
	}
	.email-link {
		display: block;
		font: 12px Arial;
		color: var(--muted);
		margin-top: 20px;
	}
	.landing-footer {
		border-top: 1px solid #dcdfd6;
	}
	.footer-top {
		padding-block: 40px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 20px;
	}
	.footer-top p {
		font-size: 13px;
	}
	.footer-bottom {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 20px;
		padding-block: 22px;
		border-top: 1px solid #dcdfd6;
		font: 11px Arial;
		color: var(--muted);
	}
	.footer-bottom nav {
		display: flex;
		gap: 20px;
	}
	@media (min-width: 1450px) {
		.hero {
			gap: 85px;
		}
	}
	@media (max-width: 1100px) {
		.container {
			width: calc(100% - 64px);
		}
		.hero {
			gap: 35px;
		}
		h1 {
			font-size: 85px;
		}
		.desktop-nav {
			gap: 18px;
		}
		.hero-photo {
			height: 500px;
		}
		.about-grid {
			gap: 60px;
		}
		.service-card {
			padding: 23px;
		}
		.principles > .container {
			font-size: 16px;
			gap: 12px;
		}
		.app-section {
			padding: 45px;
		}
		.hero-actions {
			gap: 17px;
		}
		.testimonial-layout {
			gap: 55px;
		}
	}
	@media (max-width: 800px) {
		.container {
			width: calc(100% - 40px);
		}
		.section {
			padding-block: 70px;
		}
		.header-inner {
			height: 78px;
			gap: 16px;
		}
		.desktop-nav,
		.header-cta {
			display: none;
		}
		.menu-toggle {
			display: block;
			border: 1px solid #ccd2c7;
			padding: 9px 13px;
			background: transparent;
			font: 13px Arial;
		}
		.hero {
			grid-template-columns: 1fr;
			gap: 42px;
			padding-block: 50px 55px;
		}
		.hero-copy {
			max-width: 600px;
		}
		h1 {
			font-size: clamp(65px, 12vw, 95px);
		}
		.hero-description {
			max-width: 480px;
		}
		.hero-visual {
			max-width: 600px;
			width: 100%;
			padding-left: 15px;
		}
		.hero-photo {
			height: 430px;
		}
		.coach-tag {
			left: 0;
		}
		.vertical-note {
			right: 0;
		}
		.principles > .container {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 12px;
			font-size: 16px;
		}
		.principles i {
			display: none;
		}
		.about-grid {
			grid-template-columns: 1fr 1fr;
			gap: 30px;
		}
		.about-photo {
			height: 460px;
		}
		.about-copy h2 {
			font-size: 48px;
		}
		.about-copy > p:not(.eyebrow) {
			font-size: 14px;
		}
		.section-heading {
			gap: 25px;
			align-items: flex-start;
			flex-direction: column;
		}
		.service-grid {
			grid-template-columns: 1fr;
		}
		.service-top {
			margin-bottom: 20px;
		}
		.service-card {
			padding: 28px;
		}
		.service-card > p {
			max-width: 560px;
		}
		.coaching-bottom {
			align-items: flex-start;
			flex-direction: column;
		}
		.transformation-grid,
		.product-grid {
			gap: 16px;
		}
		.comparison-photo {
			height: 190px;
		}
		.story-meta {
			font-size: 9px;
			flex-direction: column;
			gap: 7px;
		}
		h3 {
			font-size: 18px;
		}
		.product-art {
			height: 245px;
		}
		.book {
			width: 125px;
			height: 180px;
			padding: 15px;
		}
		.book strong {
			font-size: 37px;
		}
		.book > span {
			font-size: 6px;
		}
		.testimonial-layout {
			grid-template-columns: 1fr;
			gap: 40px;
		}
		.app-section {
			padding: 40px;
			gap: 20px;
		}
		.app-section h2 {
			font-size: 48px;
		}
		.app-art {
			transform: rotate(-5deg);
			min-width: 0;
		}
		.app-window {
			height: 270px;
		}
		.app-placeholder {
			height: 210px;
		}
		.footer-bottom {
			flex-wrap: wrap;
		}
		.footer-bottom > span:last-child {
			display: none;
		}
		.outline-person {
			font-size: 45px;
		}
	}
	@media (max-width: 540px) {
		.eyebrow {
			font-size: 10px;
			letter-spacing: 1.3px;
		}
		h2 {
			font-size: 49px;
		}
		.hero .eyebrow {
			font-size: 10px;
		}
		.intro {
			font-size: 20px;
		}
		.hero-actions {
			gap: 23px;
		}
		.hero-note {
			font-size: 11px;
		}
		.hero-photo {
			height: 380px;
		}
		.hero-description {
			font-size: 14px;
		}
		.coach-tag {
			padding: 17px;
		}
		.about-grid {
			grid-template-columns: 1fr;
			gap: 35px;
		}
		.about-photo {
			height: 350px;
		}
		.about-copy h2 {
			font-size: 56px;
		}
		.transformation-grid,
		.product-grid {
			grid-template-columns: 1fr;
			gap: 35px;
		}
		.comparison-photo {
			height: 290px;
		}
		.story-meta {
			flex-direction: row;
			font-size: 10px;
		}
		.product-art {
			height: 330px;
		}
		.book {
			width: 165px;
			height: 235px;
			padding: 20px;
		}
		.book strong {
			font-size: 49px;
		}
		.book > span {
			font-size: 8px;
		}
		.transformation-card > p,
		.product-card > p {
			font-size: 14px;
		}
		h3 {
			font-size: 21px;
		}
		.app-section {
			grid-template-columns: 1fr;
			padding: 35px 25px;
			gap: 25px;
		}
		.app-art {
			padding: 10px;
			transform: rotate(-4deg);
		}
		.app-window {
			height: 270px;
		}
		.contact-section h2 {
			font-size: 52px;
		}
		.contact-section p:not(.eyebrow) {
			font-size: 14px;
		}
		.footer-top {
			flex-wrap: wrap;
			padding-block: 30px;
		}
		.footer-top p {
			order: 3;
			width: 100%;
			font-size: 12px;
		}
		.footer-bottom {
			gap: 18px;
			align-items: flex-start;
			flex-direction: column;
		}
		.footer-bottom nav {
			flex-wrap: wrap;
		}
		.principles > .container {
			font-size: 14px;
			column-gap: 8px;
		}
		.wordmark {
			font-size: 30px;
		}
		.section-heading > p {
			font-size: 14px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.button {
			transition: none;
		}
		.button:hover {
			transform: none;
		}
		.landing :global(html) {
			scroll-behavior: auto;
		}
	}
</style>

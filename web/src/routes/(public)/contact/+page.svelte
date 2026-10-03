<script lang="ts">
	import { resolve } from '$app/paths';
	import { dev } from '$app/environment';
	import { tick } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	let submitting = $state(false);
	let submitted = $state(false);
	let error = $state('');
	let resultHeading = $state<HTMLHeadingElement>();

	async function submitAssessment(event: SubmitEvent) {
		event.preventDefault();
		if (submitting) return;
		error = '';
		// Vite cannot process Netlify Forms. Never report an unsent preview inquiry as received.
		if (dev) {
			error =
				'This preview cannot send assessments. Your answers are still here. To inquire now, email configains@gmail.com.';
			return;
		}
		const form = event.currentTarget as HTMLFormElement;
		const body = new SvelteURLSearchParams();
		for (const [name, value] of new FormData(form)) body.append(name, String(value));
		submitting = true;
		try {
			const response = await fetch('/assessment-form.html', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: body.toString()
			});
			if (!response.ok) throw new Error('Submission failed');
			submitted = true;
			await tick();
			resultHeading?.focus();
		} catch {
			error =
				'We couldn’t send your assessment. Your answers are still here — please try again, or email configains@gmail.com.';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Fitness & Nutrition Assessment | Configains</title>
	<meta
		name="description"
		content="Find your starting point with Configains. Share your fitness and nutrition experience so Cash Fuerte, our founder and coach, can recommend your next steps."
	/>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Coustard&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="assessment-page">
	<div class="assessment-shell">
		<a class="back-link" href={resolve('/')}>← Back to Configains</a>
		<header class="assessment-intro">
			<p class="eyebrow">CONFIGAINS COACHING · YOUR FIRST STEP</p>
			<h1>YOUR STARTING POINT.<br /><span>YOUR WAY FORWARD.</span></h1>
			<p class="intro-copy">A quick fitness & nutrition assessment.</p>
			<p>
				Tell us what you know, what you’ve tried, and where you want to go. There are no right or
				wrong answers. Cash Fuerte, our founder and coach, will personally review your responses.
			</p>
		</header>
		<div class="assessment-layout">
			<aside aria-label="What happens next">
				<p class="eyebrow">A REAL COACH. A CLEAR NEXT STEP.</p>
				<ol>
					<li>
						<strong>Share your starting point.</strong><span
							>About 3–5 minutes. No fitness expertise needed.</span
						>
					</li>
					<li>
						<strong>Cash Fuerte reviews your answers.</strong><span
							>Your experience, routine, and goals guide his recommendation.</span
						>
					</li>
					<li>
						<strong>Get a personal recommendation.</strong><span
							>Cash Fuerte emails you a Configains program, plan, and duration to discuss together.</span
						>
					</li>
				</ol>
				<p class="aside-note">
					This is an inquiry, with no commitment to join. Your next step is a conversation with Cash
					Fuerte.
				</p>
				<a href="mailto:configains@gmail.com">configains@gmail.com</a>
			</aside>
			{#if submitted}
				<section class="assessment-card success" aria-labelledby="assessment-result">
					<p class="eyebrow">YOUR FIRST STEP, TAKEN.</p>
					<h2 id="assessment-result" tabindex="-1" bind:this={resultHeading}>
						Thanks for sharing your story.
					</h2>
					<p>
						Your assessment has been submitted. Cash Fuerte will review your answers and reply to
						the email address you provided with a recommended program, plan, and duration.
					</p>
					<a class="submit-button" href={resolve('/')}>Back to Configains ↗</a>
				</section>
			{:else}
				<form
					class="assessment-card"
					name="coaching-assessment"
					method="POST"
					action="/assessment-received.html"
					data-netlify="true"
					data-netlify-honeypot="bot-field"
					onsubmit={submitAssessment}
					aria-busy={submitting}
				>
					<input type="hidden" name="form-name" value="coaching-assessment" />
					<p hidden>
						<label
							>Leave this empty <input name="bot-field" tabindex="-1" autocomplete="off" /></label
						>
					</p>
					<p class="form-note">All fields are required unless marked optional.</p>
					<fieldset disabled={submitting}>
						<legend><span>01</span> A little about you</legend>
						<div class="field-grid">
							<label
								>Your name<input name="name" autocomplete="name" required maxlength="100" /></label
							>
							<label
								>Email address<input
									name="email"
									type="email"
									autocomplete="email"
									required
									maxlength="254"
									aria-describedby="email-help"
								/></label
							>
						</div>
						<p id="email-help" class="field-help">
							Cash Fuerte will send your recommendation to this email address.
						</p>
						<label
							>What would you most like to work toward?
							<select name="goal" required>
								<option value="" disabled selected>Choose your main goal</option>
								<option>Build strength and muscle</option><option>Lose body fat</option><option
									>Improve general fitness</option
								><option>Build consistent habits</option><option
									>Feel more confident with training and nutrition</option
								><option>Explore my options with a coach</option>
							</select>
						</label>
					</fieldset>
					<fieldset disabled={submitting}>
						<legend><span>02</span> Your training starting point</legend>
						<label
							>How much training experience do you have?
							<select name="training-experience" required>
								<option value="" disabled selected>Choose what fits you best</option>
								<option>I’m new to structured training</option><option
									>I’ve tried it, but haven’t found consistency</option
								><option>I train regularly and want more direction</option><option
									>I’m returning after a break</option
								>
							</select>
						</label>
						<label
							>How confident are you planning a workout and using good exercise technique?
							<select name="fitness-knowledge" required>
								<option value="" disabled selected>Choose your confidence level</option>
								<option>I’d like help with the basics</option><option
									>I know some basics, but still need guidance</option
								><option>I’m comfortable and want to refine my approach</option>
							</select>
						</label>
						<div class="field-grid">
							<label
								>Realistically, how often can you train?
								<select name="training-days" required
									><option value="" disabled selected>Days per week</option><option>1–2 days</option
									><option>3–4 days</option><option>5+ days</option><option
										>I need help figuring this out</option
									></select
								>
							</label>
							<label
								>Where would you train?
								<select name="training-location" required
									><option value="" disabled selected>Choose your setup</option><option
										>At a gym</option
									><option>At home with equipment</option><option
										>At home with little or no equipment</option
									><option>A mix / not sure yet</option></select
								>
							</label>
						</div>
					</fieldset>
					<fieldset disabled={submitting}>
						<legend><span>03</span> Nutrition & everyday life</legend>
						<label
							>How familiar are you with nutrition basics, like protein, portions, and balanced
							meals?
							<select name="nutrition-knowledge" required
								><option value="" disabled selected>Choose your confidence level</option><option
									>I’m just getting started</option
								><option>I know the basics, but find them hard to apply</option><option
									>I’m comfortable and want more specific guidance</option
								></select
							>
						</label>
						<label
							>What’s your experience with nutrition habits or plans?
							<select name="nutrition-experience" required
								><option value="" disabled selected>Choose what fits you best</option><option
									>I haven’t followed a nutrition approach before</option
								><option>I’ve tried diets or plans, but struggled to sustain them</option><option
									>I work on balanced meals and portions without tracking</option
								><option>I’ve tracked food or followed a structured plan</option></select
							>
						</label>
						<label
							>What’s your biggest challenge right now?
							<textarea
								name="biggest-challenge"
								rows="3"
								required
								maxlength="1500"
								placeholder="For example: finding time, knowing what to eat, or staying consistent."
							></textarea>
						</label>
						<label
							>Anything else you’d like Cash Fuerte to know? <span class="optional">(optional)</span
							>
							<textarea
								name="additional-context"
								rows="3"
								maxlength="1500"
								placeholder="Your routine, preferences, previous coaching experience, or questions."
							></textarea>
						</label>
					</fieldset>
					<div class="form-footer">
						<p>
							Your answers are shared with Configains for Cash Fuerte to review your inquiry and
							contact you about coaching. Please leave out sensitive medical details.
						</p>
						<label class="consent"
							><input
								type="checkbox"
								name="consent"
								value="I agree to Configains reviewing my answers and contacting me about coaching."
								required
								disabled={submitting}
							/><span
								>I agree to Configains using my answers to assess my inquiry and contact me about
								coaching.</span
							></label
						>
						{#if error}<p class="form-error" role="alert">{error}</p>{/if}
						<button class="submit-button" type="submit" disabled={submitting}
							>{submitting ? 'Sending your assessment…' : 'Send my assessment ↗'}</button
						>
						<p class="submit-note" aria-live="polite">
							{submitting
								? 'Please keep this page open while your answers are sent.'
								: 'Reviewed personally by Cash Fuerte. No commitment to join.'}
						</p>
					</div>
				</form>
			{/if}
		</div>
	</div>
</div>

<style>
	.assessment-page {
		background: #f7f8f5;
		color: #182a30;
		padding: 36px 24px 88px;
	}
	.assessment-shell {
		max-width: 1160px;
		margin: auto;
	}
	.back-link {
		font-size: 0.875rem;
		font-weight: 600;
	}
	.assessment-intro {
		max-width: 780px;
		padding: 48px 0;
	}
	.eyebrow {
		font:
			700 0.75rem/1.6 Arial,
			sans-serif;
		letter-spacing: 0.12em;
		color: #157f90;
	}
	h1 {
		font:
			400 clamp(3.4rem, 7vw, 5.8rem)/1 'Bebas Neue',
			Impact,
			sans-serif;
		margin: 20px 0;
	}
	h1 span {
		color: #157f90;
	}
	.assessment-intro > p:not(.eyebrow) {
		max-width: 650px;
		line-height: 1.8;
		color: #56676b;
	}
	.assessment-intro .intro-copy {
		font:
			1.25rem/1.6 'Coustard',
			Georgia,
			serif;
		color: #182a30;
		margin-bottom: 12px;
	}
	.assessment-layout {
		display: grid;
		grid-template-columns: minmax(0, 0.7fr) minmax(0, 1.6fr);
		gap: 48px;
		align-items: start;
	}
	aside {
		padding-top: 16px;
	}
	ol {
		padding: 0;
		list-style: none;
		counter-reset: steps;
		margin: 28px 0;
	}
	li {
		counter-increment: steps;
		position: relative;
		padding: 0 0 26px 36px;
	}
	li::before {
		content: '0' counter(steps);
		position: absolute;
		left: 0;
		color: #157f90;
		font-weight: 700;
		font-size: 0.8rem;
	}
	li strong,
	li span {
		display: block;
	}
	li span,
	.aside-note {
		color: #56676b;
		font-size: 0.9rem;
		line-height: 1.7;
		margin-top: 8px;
	}
	aside > a {
		display: inline-block;
		margin-top: 20px;
		text-decoration: underline;
		overflow-wrap: anywhere;
	}
	.assessment-card {
		background: #fff;
		border: 1px solid #dce5e2;
		border-top: 4px solid #59d9e8;
		padding: clamp(22px, 4vw, 42px);
		border-radius: 4px;
		min-width: 0;
	}
	.form-note,
	.field-help,
	.form-footer > p,
	.optional {
		font-size: 0.8rem;
		color: #56676b;
		line-height: 1.65;
	}
	.form-note {
		margin-bottom: 28px;
	}
	fieldset {
		border: 0;
		padding: 0 0 30px;
		margin: 0 0 28px;
		border-bottom: 1px solid #dce5e2;
		min-width: 0;
	}
	legend {
		font-size: 1.18rem;
		font-weight: 700;
		padding: 0;
		margin-bottom: 24px;
	}
	legend > span {
		color: #157f90;
		font-size: 0.8rem;
		margin-right: 10px;
	}
	label {
		display: block;
		font-size: 0.9rem;
		font-weight: 600;
		line-height: 1.6;
	}
	fieldset > label,
	fieldset > .field-grid {
		margin-top: 20px;
	}
	.field-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 18px;
	}
	input:not([type='checkbox']),
	select,
	textarea {
		display: block;
		width: 100%;
		margin-top: 8px;
		border: 1px solid #b7c6c7;
		border-radius: 4px;
		background-color: #fcfdfb;
		color: #182a30;
		font:
			400 1rem/1.5 Arial,
			sans-serif;
		padding: 12px;
		min-height: 48px;
	}
	select {
		padding-right: 36px;
	}
	textarea {
		resize: vertical;
	}
	.field-help {
		margin-top: 8px;
	}
	.consent {
		display: flex;
		align-items: start;
		gap: 12px;
		margin: 20px 0;
		font-weight: 400;
	}
	.consent input {
		flex-shrink: 0;
		width: 20px;
		height: 20px;
		margin-top: 3px;
		accent-color: #157f90;
	}
	.submit-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 16px 24px;
		min-height: 52px;
		background: #182a30;
		color: white;
		font-weight: 700;
		border: 0;
		border-radius: 4px;
		cursor: pointer;
		text-decoration: none;
		transition: background 0.2s;
	}
	.submit-button:hover {
		background: #157f90;
	}
	.submit-button:disabled {
		cursor: wait;
		opacity: 0.65;
	}
	.submit-note {
		margin-top: 12px;
	}
	.form-footer .form-error {
		padding: 14px;
		margin-bottom: 20px;
		background: #fff1ee;
		color: #962f24;
		border: 1px solid #efb8ac;
	}
	.success h2 {
		font:
			400 2rem/1.2 'Coustard',
			Georgia,
			serif;
		margin: 20px 0;
	}
	.success > p:not(.eyebrow) {
		line-height: 1.8;
		color: #56676b;
		margin-bottom: 28px;
	}
	:focus-visible {
		outline: 3px solid #157f90;
		outline-offset: 4px;
	}
	@media (max-width: 800px) {
		.assessment-layout {
			grid-template-columns: 1fr;
			gap: 24px;
		}
		aside {
			padding-top: 0;
		}
		ol {
			margin: 20px 0 0;
		}
		.assessment-intro {
			padding-bottom: 20px;
		}
	}
	@media (max-width: 480px) {
		.assessment-page {
			padding-inline: 16px;
		}
		.field-grid {
			grid-template-columns: 1fr;
		}
		.submit-button {
			width: 100%;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.submit-button {
			transition: none;
		}
	}
</style>

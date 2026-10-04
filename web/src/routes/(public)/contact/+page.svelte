<script lang="ts">
	import { dev } from '$app/environment';
	import { tick } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { publicHref } from '$lib/content/links';
	import type { Content } from '$lib/content/schema';
	let { data } = $props();
	const c = $derived(data.site.contact),
		email = $derived(data.site.brand.email);
	let submitting = $state(false),
		submitted = $state(false),
		error = $state('');
	let resultHeading = $state<HTMLHeadingElement>();
	async function submitAssessment(event: SubmitEvent) {
		event.preventDefault();
		if (submitting) return;
		error = '';
		if (dev || data.preview) {
			error = c.previewError.replaceAll('{email}', email);
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
			error = c.error.replaceAll('{email}', email);
		} finally {
			submitting = false;
		}
	}
</script>

{#snippet question(name: string, content: Content)}
	<label
		>{content.label}<select {name} required
			><option value="" disabled selected>{content.placeholder}</option
			>{#each content.options as option, index (index)}<option>{option}</option>{/each}</select
		></label
	>
{/snippet}
<div class="assessment-page">
	<div class="assessment-shell">
		<a class="back-link" href={publicHref('/', data.preview)}>← {c.back}</a>
		<header class="assessment-intro">
			<p class="eyebrow">{c.hero.eyebrow}</p>
			<h1 class="pre-line">{c.hero.title}</h1>
			<p class="intro-copy">{c.intro}</p>
			<p class="pre-line">{c.hero.copy}</p>
		</header>
		<div class="assessment-layout">
			<aside aria-label="What happens next">
				<p class="eyebrow">{c.stepsLabel}</p>
				<ol>
					{#each c.steps as step, index (index)}<li>
							<strong>{step.title}</strong><span>{step.copy}</span>
						</li>{/each}
				</ol>
				<p class="aside-note">{c.note}</p>
				<a href={'mailto:' + email}>{email}</a>
			</aside>
			{#if submitted}<section class="assessment-card success" aria-labelledby="assessment-result">
					<p class="eyebrow">{c.successEyebrow}</p>
					<h2 id="assessment-result" tabindex="-1" bind:this={resultHeading}>{c.successTitle}</h2>
					<p>{c.successCopy}</p>
					<a class="submit-button" href={publicHref('/', data.preview)}>{c.back} ↗</a>
				</section>
			{:else}<form
					class="assessment-card"
					name="coaching-assessment"
					method="POST"
					action="/assessment-received"
					data-netlify="true"
					data-netlify-honeypot="bot-field"
					onsubmit={submitAssessment}
					aria-busy={submitting}
				>
					<input type="hidden" name="form-name" value="coaching-assessment" />
					<p hidden>
						<label
							>Leave this empty<input name="bot-field" tabindex="-1" autocomplete="off" /></label
						>
					</p>
					<p class="form-note">{c.formNote}</p>
					<fieldset disabled={submitting}>
						<legend><span>01</span>{c.sectionOne}</legend>
						<div class="field-grid">
							<label
								>{c.nameLabel}<input
									name="name"
									autocomplete="name"
									required
									maxlength="100"
								/></label
							><label
								>{c.emailLabel}<input
									name="email"
									type="email"
									autocomplete="email"
									required
									maxlength="254"
									aria-describedby="email-help"
								/></label
							>
						</div>
						<p id="email-help" class="field-help">{c.emailHelp}</p>
						{@render question('goal', c.goal)}
					</fieldset>
					<fieldset disabled={submitting}>
						<legend><span>02</span>{c.sectionTwo}</legend>{@render question(
							'training-experience',
							c.trainingExperience
						)}{@render question('fitness-knowledge', c.fitnessKnowledge)}
						<div class="field-grid">
							{@render question('training-days', c.trainingDays)}{@render question(
								'training-location',
								c.trainingLocation
							)}
						</div>
					</fieldset>
					<fieldset disabled={submitting}>
						<legend><span>03</span>{c.sectionThree}</legend>{@render question(
							'nutrition-knowledge',
							c.nutritionKnowledge
						)}{@render question('nutrition-experience', c.nutritionExperience)}
						<label
							>{c.challengeLabel}<textarea
								name="biggest-challenge"
								rows="3"
								required
								maxlength="1500"
								placeholder={c.challengePlaceholder}></textarea></label
						>
						<label
							>{c.contextLabel} <span class="optional">{c.optionalLabel}</span><textarea
								name="additional-context"
								rows="3"
								maxlength="1500"
								placeholder={c.contextPlaceholder}></textarea></label
						>
					</fieldset>
					<div class="form-footer">
						<p>{c.privacy}</p>
						<label class="consent"
							><input
								type="checkbox"
								name="consent"
								value={c.consent}
								required
								disabled={submitting}
							/><span>{c.consent}</span></label
						>
						{#if error}<p class="form-error" role="alert">{error}</p>{/if}<button
							class="submit-button"
							type="submit"
							disabled={submitting}>{submitting ? c.submitting : c.submit + ' ↗'}</button
						>
						<p class="submit-note" aria-live="polite">
							{submitting ? c.sendingNote : c.submitNote}
						</p>
					</div>
				</form>{/if}
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

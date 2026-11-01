<script lang="ts">
	import { dev } from '$app/environment';
	import { tick } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import Arrow from '$lib/components/landing/Arrow.svelte';
	import SectionLabel from '$lib/components/landing/SectionLabel.svelte';
	import { container, section as sectionSpacing } from '$lib/components/landing/styles';
	import { publicHref } from '$lib/content/links';
	import type { Content } from '$lib/content/schema';
	let { data } = $props();
	const c = $derived(data.site.contact),
		email = $derived(data.site.brand.email);
	let submitting = $state(false),
		submitted = $state(false),
		error = $state('');
	let resultHeading = $state<HTMLHeadingElement>();
	const focusRing =
		'focus-visible:outline-3 focus-visible:outline-cyan-ink focus-visible:outline-offset-4';
	const label = 'block text-[0.95rem] leading-[1.6] text-ink';
	/** Labels placed directly in a fieldset are spaced from the field above. */
	const fieldsetLabel = `${label} [fieldset>&:not(legend+*)]:mt-5`;
	const control = `mt-2 block min-h-12 w-full rounded-[3px] border border-ink/35 bg-white p-3 text-[1rem]/[1.5] text-ink ${focusRing}`;
	const fieldGrid =
		'grid grid-cols-2 gap-[18px] bp-767:grid-cols-1 [fieldset>&:not(legend+*)]:mt-5';
	const fieldset = `mb-7 min-w-0 [border-width:0_0_1px] [border-style:none_none_solid] border-b-ink/15 p-0 pb-[30px] ${focusRing}`;
	const legend = 'mb-5 p-0 font-display text-[1.875rem]/none font-normal text-ink';
	const legendNumber = 'mr-3 text-[1.25rem] tracking-[0.1em] text-cyan-deep';
	const note = 'text-[0.8125rem] leading-[1.65] text-ink-soft';
	const marker = 'ml-[0.25em] text-cyan-deep';
	const card =
		'min-w-0 rounded-[3px] border border-ink/15 border-t-4 border-t-cyan bg-white p-[clamp(22px,4vw,42px)] bp-1100:[grid-area:form]';
	const submit =
		'group inline-flex min-h-[56px] cursor-pointer items-center justify-center gap-4 rounded-[3px] [border:0] bg-ink px-7 pt-[0.95rem] pb-[0.8rem] font-display text-[1.3rem]/none tracking-[0.09em] text-bone no-underline [transition:background-color_0.25s,color_0.25s] hover:bg-cyan hover:text-ink disabled:cursor-wait disabled:opacity-65 motion-reduce:[transition:none] bp-480:w-full';
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
	<label class={fieldsetLabel}
		>{content.label}<span class={marker} aria-hidden="true">*</span><select
			class="{control} pr-9"
			{name}
			required
			><option value="" disabled selected>{content.placeholder}</option
			>{#each content.options as option, index (index)}<option>{option}</option>{/each}</select
		></label
	>
{/snippet}
<div class="{sectionSpacing} text-ink">
	<div class={container}>
		<a
			class="inline-flex min-h-11 items-center text-[0.9375rem] hover:text-cyan-deep"
			href={publicHref('/', data.preview)}>← {c.back}</a
		>
		<header class="max-w-[780px] pt-[clamp(24px,4vw,40px)] pb-[clamp(40px,5vw,64px)]">
			<h1 class="mb-6 text-[clamp(3.5rem,8vw,7rem)] whitespace-pre-line">
				{c.hero.title}
			</h1>
			<p class="mb-3 max-w-[650px] text-[1.25rem]/[1.6] text-ink">
				{c.intro}
			</p>
			<p class="max-w-[650px] leading-[1.8] whitespace-pre-line text-ink-soft">{c.hero.copy}</p>
		</header>
		<div
			class="grid grid-cols-[minmax(0,0.7fr)_minmax(0,1.6fr)] [align-items:start] gap-[clamp(32px,4vw,56px)] bp-1100:grid-cols-1 bp-1100:gap-9 bp-1100:[grid-template-areas:'form'_'steps']"
		>
			<aside
				class="pt-4 bp-1100:border-t bp-1100:border-t-ink/15 bp-1100:pt-7 bp-1100:[grid-area:steps]"
				aria-label="What happens next"
			>
				<ol
					class="my-7 list-none p-0 [counter-reset:steps] bp-1100:m-0 bp-1100:grid bp-1100:grid-cols-3 bp-1100:gap-6 bp-767:grid-cols-1 bp-767:gap-[18px]"
				>
					{#each c.steps as step, index (index)}<li
							class="relative pb-[26px] pl-12 [counter-increment:steps] before:absolute before:left-0 before:font-display before:text-[1.5rem] before:leading-none before:text-cyan-deep before:content-['0'_counter(steps)] bp-1100:min-w-0 bp-1100:pb-0"
						>
							<strong class="block font-display text-[1.5rem]/none font-normal text-ink"
								>{step.title}</strong
							><span class="mt-2 block text-[0.9rem] leading-[1.7] text-ink-soft">{step.copy}</span>
						</li>{/each}
				</ol>
				<a
					class="mt-5 inline-block wrap-anywhere underline decoration-cyan decoration-2 underline-offset-4 bp-1100:mt-6"
					href={'mailto:' + email}>{email}</a
				>
			</aside>
			{#if submitted}<section class={card} aria-labelledby="assessment-result">
					<SectionLabel>{c.successEyebrow}</SectionLabel>
					<h2
						id="assessment-result"
						class="my-5 text-[clamp(2.5rem,5vw,3.5rem)] {focusRing}"
						tabindex="-1"
						bind:this={resultHeading}
					>
						{c.successTitle}
					</h2>
					<p class="mb-7 leading-[1.8] text-ink-soft">{c.successCopy}</p>
					<a class={submit} href={publicHref('/', data.preview)}>{c.back}<Arrow /></a>
				</section>
			{:else}<form
					class={card}
					name="coaching-assessment"
					method="POST"
					action="/assessment-received"
					data-netlify="true"
					data-netlify-honeypot="bot-field"
					onsubmit={submitAssessment}
					aria-busy={submitting}
				>
					<input class={control} type="hidden" name="form-name" value="coaching-assessment" />
					<p hidden>
						<label class={label}
							>Leave this empty<input
								class={control}
								name="bot-field"
								tabindex="-1"
								autocomplete="off"
							/></label
						>
					</p>
					<fieldset class={fieldset} disabled={submitting}>
						<legend class={legend}><span class={legendNumber}>01</span>{c.sectionOne}</legend>
						<div class={fieldGrid}>
							<label class={label}
								>{c.nameLabel}<span class={marker} aria-hidden="true">*</span><input
									class={control}
									name="name"
									autocomplete="name"
									required
									maxlength="100"
								/></label
							><label class={label}
								>{c.emailLabel}<span class={marker} aria-hidden="true">*</span><input
									class={control}
									name="email"
									type="email"
									autocomplete="email"
									required
									maxlength="254"
									aria-describedby="email-help"
								/></label
							>
						</div>
						<p id="email-help" class="mt-2 {note}">{c.emailHelp}</p>
						{@render question('goal', c.goal)}
					</fieldset>
					<fieldset class={fieldset} disabled={submitting}>
						<legend class={legend}><span class={legendNumber}>02</span>{c.sectionTwo}</legend
						>{@render question('training-experience', c.trainingExperience)}{@render question(
							'fitness-knowledge',
							c.fitnessKnowledge
						)}
						<div class={fieldGrid}>
							{@render question('training-days', c.trainingDays)}{@render question(
								'training-location',
								c.trainingLocation
							)}
						</div>
					</fieldset>
					<fieldset class={fieldset} disabled={submitting}>
						<legend class={legend}><span class={legendNumber}>03</span>{c.sectionThree}</legend
						>{@render question('nutrition-knowledge', c.nutritionKnowledge)}{@render question(
							'nutrition-experience',
							c.nutritionExperience
						)}
						<label class={fieldsetLabel}
							>{c.challengeLabel}<span class={marker} aria-hidden="true">*</span><textarea
								class="{control} resize-y"
								name="biggest-challenge"
								rows="3"
								required
								maxlength="1500"
								placeholder={c.challengePlaceholder}></textarea></label
						>
						<label class={fieldsetLabel}
							>{c.contextLabel} <span class={note}>{c.optionalLabel}</span><textarea
								class="{control} resize-y"
								name="additional-context"
								rows="3"
								maxlength="1500"
								placeholder={c.contextPlaceholder}></textarea></label
						>
					</fieldset>
					<div>
						<p class={note}>{c.privacy}</p>
						<label class="my-5 flex [align-items:start] gap-3 text-[0.9rem] leading-[1.6]"
							><input
								class="mt-[3px] size-5 shrink-0 accent-cyan-ink {focusRing}"
								type="checkbox"
								name="consent"
								value={c.consent}
								required
								disabled={submitting}
							/><span>{c.consent}<span class={marker} aria-hidden="true">*</span></span></label
						>
						{#if error}<p
								class="mb-5 border border-[#efb8ac] bg-[#fff1ee] p-[14px] text-[0.8rem] leading-[1.65] text-[#962f24]"
								role="alert"
							>
								{error}
							</p>{/if}<button class={submit} type="submit" disabled={submitting}
							>{submitting ? c.submitting : c.submit}{#if !submitting}<Arrow />{/if}</button
						>
						{#if submitting}<p class="mt-3 {note}" aria-live="polite">{c.sendingNote}</p>{/if}
					</div>
				</form>{/if}
		</div>
	</div>
</div>

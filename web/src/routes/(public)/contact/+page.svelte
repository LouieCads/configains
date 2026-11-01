<script lang="ts">
	import { dev } from '$app/environment';
	import { onMount, tick } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import Arrow from '$lib/components/landing/Arrow.svelte';
	import SectionLabel from '$lib/components/landing/SectionLabel.svelte';
	import { container, textLink } from '$lib/components/landing/styles';
	import { publicHref } from '$lib/content/links';
	import type { Content } from '$lib/content/schema';
	import FormProgress from '$lib/features/forms/FormProgress.svelte';
	import SaveStatus from '$lib/features/forms/SaveStatus.svelte';
	import { StepFlow } from '$lib/features/forms/step-flow.svelte';
	let { data } = $props();
	const c = $derived(data.site.contact),
		f = $derived(c.flow),
		email = $derived(data.site.brand.email);
	let submitting = $state(false),
		submitted = $state(false),
		error = $state('');
	let resultHeading = $state<HTMLHeadingElement>();
	let form = $state<HTMLFormElement>();
	// Consent is never saved in a draft: it is given fresh when the form is sent.
	let consent = $state(false);

	/** Answers kept in the draft. The honeypot and consent are left out on purpose. */
	const answers = [
		'name',
		'email',
		'goal',
		'training-experience',
		'fitness-knowledge',
		'training-days',
		'training-location',
		'nutrition-knowledge',
		'nutrition-experience',
		'biggest-challenge',
		'additional-context'
	];
	const flow = new StepFlow({
		key: 'configains:assessment-draft:v1',
		steps: 4,
		fields: answers
	});
	const messages = $derived({ required: f.requiredError, email: f.emailError });
	/** What the review step lists, one block per field group. */
	const review = $derived([
		{
			title: c.sectionOne,
			items: [
				{ name: 'name', label: c.nameLabel },
				{ name: 'email', label: c.emailLabel },
				{ name: 'goal', label: c.goal.label }
			]
		},
		{
			title: c.sectionTwo,
			items: [
				{ name: 'training-experience', label: c.trainingExperience.label },
				{ name: 'fitness-knowledge', label: c.fitnessKnowledge.label },
				{ name: 'training-days', label: c.trainingDays.label },
				{ name: 'training-location', label: c.trainingLocation.label }
			]
		},
		{
			title: c.sectionThree,
			items: [
				{ name: 'nutrition-knowledge', label: c.nutritionKnowledge.label },
				{ name: 'nutrition-experience', label: c.nutritionExperience.label },
				{ name: 'biggest-challenge', label: c.challengeLabel, wide: true },
				{ name: 'additional-context', label: c.contextLabel, wide: true }
			]
		}
	]);

	onMount(() => {
		// A saved answer that is no longer one of the choices is dropped.
		flow.restore({
			goal: c.goal.options,
			'training-experience': c.trainingExperience.options,
			'fitness-knowledge': c.fitnessKnowledge.options,
			'training-days': c.trainingDays.options,
			'training-location': c.trainingLocation.options,
			'nutrition-knowledge': c.nutritionKnowledge.options,
			'nutrition-experience': c.nutritionExperience.options
		});
		return () => flow.flush();
	});
	$effect(() => flow.track());

	const focusRing =
		'focus-visible:outline-3 focus-visible:outline-cyan-ink focus-visible:outline-offset-4';
	const label = 'block text-[0.95rem] leading-[1.6] text-ink';
	/** Labels placed directly in a fieldset are spaced from the field above. */
	const fieldsetLabel = `${label} [fieldset>&:not(legend+*)]:mt-4`;
	// scroll-mb keeps a focused field clear of the pinned button bar.
	const control = `mt-1.5 block min-h-11 w-full scroll-mb-32 rounded-[3px] border border-ink/35 bg-white px-3 py-2 text-[1rem]/[1.5] text-ink aria-invalid:border-[#962f24] aria-invalid:[box-shadow:0_0_0_1px_#962f24] ${focusRing}`;
	const fieldGrid =
		'grid grid-cols-2 gap-x-4 gap-y-4 bp-767:grid-cols-1 [fieldset>&:not(legend+*)]:mt-4';
	const fieldset = 'm-0 min-w-0 p-0 pb-5';
	const legend =
		'mb-4 p-0 font-display text-[1.75rem]/none font-normal text-ink focus:outline-hidden';
	const note = 'text-[0.8125rem] leading-[1.65] text-ink-soft';
	const marker = 'ml-[0.25em] text-cyan-deep';
	const alertBox =
		'mb-4 scroll-my-32 border border-[#efb8ac] bg-[#fff1ee] px-3.5 py-2.5 text-[0.8rem] leading-[1.6] text-[#962f24]';
	const card =
		'min-w-0 scroll-mt-24 rounded-[3px] border border-ink/15 border-t-4 border-t-cyan bg-white [--pad:clamp(18px,3vw,30px)] p-(--pad) bp-1100:[grid-area:form]';
	const buttonBase =
		'group inline-flex min-h-[52px] cursor-pointer items-center justify-center gap-3 rounded-[3px] px-7 pt-[0.85rem] pb-[0.7rem] font-display text-[1.3rem]/none tracking-[0.09em] no-underline [transition:background-color_0.25s,color_0.25s] disabled:cursor-wait disabled:opacity-65 motion-reduce:[transition:none]';
	const submit = `${buttonBase} [border:0] bg-ink text-bone hover:bg-cyan hover:text-ink bp-480:flex-1 bp-480:gap-2 bp-480:px-3 bp-480:text-[1.1rem] bp-480:tracking-[0.05em]`;
	const ghost = `${buttonBase} border border-ink/35 bg-transparent text-ink hover:bg-ink hover:text-bone bp-480:w-[52px] bp-480:flex-none bp-480:px-0`;

	const invalid = (name: string) => (flow.errors[name] ? 'true' : undefined);
	const described = (name: string, extra?: string) =>
		[extra, flow.errors[name] ? `${name}-error` : undefined].filter(Boolean).join(' ') || undefined;

	/** The container of one step's fields. */
	const stepRoot = (index: number) =>
		form?.querySelector<HTMLElement>(`[data-step="${index}"]`) ?? null;
	function scrollToForm() {
		const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
		form?.scrollIntoView({ block: 'start', behavior: calm ? 'auto' : 'smooth' });
	}
	/** After a step change: show the top of the form and move focus to the new step's heading. */
	async function moved() {
		await tick();
		form?.querySelector<HTMLElement>('[data-step]:not([hidden]) legend')?.focus({
			preventScroll: true
		});
		scrollToForm();
	}
	async function advance() {
		if (flow.next(stepRoot(flow.step), messages)) await moved();
	}
	async function back() {
		flow.previous();
		await moved();
	}
	async function edit(index: number) {
		flow.edit(index);
		await moved();
	}
	/** Brings the send error into view, clear of the pinned button bar. */
	async function showError() {
		await tick();
		form?.querySelector('[data-alert]')?.scrollIntoView({ block: 'nearest' });
	}
	async function clearAnswers() {
		if (!window.confirm(f.clearConfirm)) return;
		flow.reset();
		consent = false;
		error = '';
		await moved();
	}

	async function submitAssessment(event: SubmitEvent) {
		event.preventDefault();
		if (submitting) return;
		// Enter inside a field on an earlier step goes to the next step.
		if (flow.step < flow.last) return advance();
		error = '';
		// Check every step again, so nothing slips through on the way to sending.
		for (let index = 0; index <= flow.last; index++) {
			if (flow.validate(stepRoot(index), messages)) continue;
			if (index !== flow.step) {
				flow.jump(index);
				await tick();
				flow.validate(stepRoot(index), messages);
				scrollToForm();
			}
			return;
		}
		if (dev || data.preview) {
			error = c.previewError.replaceAll('{email}', email);
			return showError();
		}
		const body = new SvelteURLSearchParams();
		for (const [name, value] of new FormData(event.currentTarget as HTMLFormElement))
			body.append(name, String(value));
		submitting = true;
		try {
			const response = await fetch('/assessment-form.html', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: body.toString()
			});
			if (!response.ok) throw new Error('Submission failed');
			flow.discard();
			submitted = true;
			await tick();
			resultHeading?.focus();
		} catch {
			error = c.error.replaceAll('{email}', email);
			await showError();
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:window onpagehide={() => flow.flush()} />
<svelte:document
	onvisibilitychange={() => {
		if (document.visibilityState === 'hidden') flow.flush();
	}}
/>

{#snippet fieldError(name: string)}
	<!-- Hidden from the label's name; the field points to it with aria-describedby. -->
	{#if flow.errors[name]}<span
			id="{name}-error"
			class="mt-2 block text-[0.8125rem] leading-[1.5] text-[#962f24]"
			aria-hidden="true">{flow.errors[name]}</span
		>{/if}
{/snippet}
{#snippet question(name: string, content: Content)}
	<label class={fieldsetLabel}
		>{content.label}<span class={marker} aria-hidden="true">*</span><select
			class="{control} pr-9"
			{name}
			required
			bind:value={flow.values[name]}
			aria-invalid={invalid(name)}
			aria-describedby={described(name)}
			oninput={(event) => flow.revalidate(event.currentTarget, messages)}
			><option value="" disabled>{content.placeholder}</option
			>{#each content.options as option, index (index)}<option value={option}>{option}</option
				>{/each}</select
		>{@render fieldError(name)}</label
	>
{/snippet}
<div class="pt-[clamp(4px,1vw,12px)] pb-[clamp(72px,9vw,136px)] text-ink">
	<div class={container}>
		<a
			class="mb-1 inline-flex min-h-11 items-center text-[0.9375rem] hover:text-cyan-deep"
			href={publicHref('/', data.preview)}>← {c.back}</a
		>
		<!-- The page keeps one heading for screen readers and search; the visible intro was removed. -->
		<h1 class="sr-only">{c.seo.title}</h1>
		<div
			class="grid grid-cols-[minmax(0,0.7fr)_minmax(0,1.6fr)] [align-items:start] gap-[clamp(32px,4vw,56px)] bp-1100:grid-cols-1 bp-1100:gap-9 bp-1100:[grid-template-areas:'form'_'steps']"
		>
			<aside
				class="bp-1100:border-t bp-1100:border-t-ink/15 bp-1100:pt-7 bp-1100:[grid-area:steps]"
				aria-label="What happens next"
			>
				<ol
					class="mt-0 mb-7 list-none p-0 [counter-reset:steps] bp-1100:m-0 bp-1100:grid bp-1100:grid-cols-3 bp-1100:gap-6 bp-767:grid-cols-1 bp-767:gap-[18px]"
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
					<a class="{submit} hover:no-underline" href={publicHref('/', data.preview)}
						>{c.back}<Arrow /></a
					>
				</section>
			{:else}<form
					class={card}
					name="coaching-assessment"
					method="POST"
					action="/assessment-received"
					data-netlify="true"
					data-netlify-honeypot="bot-field"
					novalidate
					bind:this={form}
					onsubmit={submitAssessment}
					aria-busy={submitting}
				>
					<FormProgress
						current={flow.step + 1}
						total={flow.last + 1}
						counterText={f.stepCounter}
						percentText={f.percentComplete}
						label={f.progressLabel}
					/>
					{#if flow.restored}<p
							class="mb-4 border-l-4 border-l-cyan bg-mist px-3.5 py-2 text-[0.875rem] leading-[1.5] text-ink"
							role="status"
						>
							{f.restored}
						</p>{/if}
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
					<!-- Every step stays in the page, so the whole form is sent together. -->
					<fieldset class={fieldset} disabled={submitting} hidden={flow.step !== 0} data-step="0">
						<legend class={legend} tabindex="-1">{c.sectionOne}</legend>
						<div class={fieldGrid}>
							<label class={label}
								>{c.nameLabel}<span class={marker} aria-hidden="true">*</span><input
									class={control}
									name="name"
									autocomplete="name"
									required
									maxlength="100"
									bind:value={flow.values.name}
									aria-invalid={invalid('name')}
									aria-describedby={described('name')}
									oninput={(event) => flow.revalidate(event.currentTarget, messages)}
								/>{@render fieldError('name')}</label
							><label class={label}
								>{c.emailLabel}<span class={marker} aria-hidden="true">*</span><input
									class={control}
									name="email"
									type="email"
									autocomplete="email"
									required
									maxlength="254"
									bind:value={flow.values.email}
									aria-invalid={invalid('email')}
									aria-describedby={described('email', 'email-help')}
									oninput={(event) => flow.revalidate(event.currentTarget, messages)}
								/>{@render fieldError('email')}</label
							>
						</div>
						<p id="email-help" class="mt-1 {note}">{c.emailHelp}</p>
						{@render question('goal', c.goal)}
					</fieldset>
					<fieldset class={fieldset} disabled={submitting} hidden={flow.step !== 1} data-step="1">
						<legend class={legend} tabindex="-1">{c.sectionTwo}</legend>{@render question(
							'training-experience',
							c.trainingExperience
						)}{@render question('fitness-knowledge', c.fitnessKnowledge)}
						<div class={fieldGrid}>
							{@render question('training-days', c.trainingDays)}{@render question(
								'training-location',
								c.trainingLocation
							)}
						</div>
					</fieldset>
					<fieldset class={fieldset} disabled={submitting} hidden={flow.step !== 2} data-step="2">
						<legend class={legend} tabindex="-1">{c.sectionThree}</legend>{@render question(
							'nutrition-knowledge',
							c.nutritionKnowledge
						)}{@render question('nutrition-experience', c.nutritionExperience)}
						<label class={fieldsetLabel}
							>{c.challengeLabel}<span class={marker} aria-hidden="true">*</span><textarea
								class="{control} resize-y"
								name="biggest-challenge"
								rows="2"
								required
								maxlength="1500"
								placeholder={c.challengePlaceholder}
								bind:value={flow.values['biggest-challenge']}
								aria-invalid={invalid('biggest-challenge')}
								aria-describedby={described('biggest-challenge')}
								oninput={(event) => flow.revalidate(event.currentTarget, messages)}
							></textarea>{@render fieldError('biggest-challenge')}</label
						>
						<label class={fieldsetLabel}
							>{c.contextLabel} <span class={note}>{c.optionalLabel}</span><textarea
								class="{control} resize-y"
								name="additional-context"
								rows="2"
								maxlength="1500"
								placeholder={c.contextPlaceholder}
								bind:value={flow.values['additional-context']}></textarea></label
						>
					</fieldset>
					<fieldset class={fieldset} disabled={submitting} hidden={flow.step !== 3} data-step="3">
						<legend class={legend} tabindex="-1">{f.reviewTitle}</legend>
						<p class="mb-3 {note}">{f.reviewCopy}</p>
						{#each review as group, index (index)}
							<section class="border-t border-t-ink/15 py-2" aria-labelledby="review-{index}">
								<div class="flex items-center justify-between gap-4">
									<h2 id="review-{index}" class="text-[1.375rem]/none">
										{group.title}
									</h2>
									<button
										type="button"
										class="{textLink} cursor-pointer"
										onclick={() => edit(index)}
										>{f.edit}<span class="sr-only"> {group.title}</span></button
									>
								</div>
								<dl class="m-0 mt-1 mb-2 grid grid-cols-2 gap-x-6 gap-y-2 bp-640:grid-cols-1">
									{#each group.items as item (item.name)}
										<div class={item.wide ? 'col-span-2 bp-640:col-span-1' : ''}>
											<dt class="{note} leading-[1.4]">{item.label}</dt>
											<dd
												class="m-0 text-[0.9375rem]/[1.5] wrap-anywhere whitespace-pre-wrap text-ink"
											>
												{flow.values[item.name]?.trim() || f.notAnswered}
											</dd>
										</div>
									{/each}
								</dl>
							</section>
						{/each}
						<div class="border-t border-t-ink/15 pt-3">
							<p class={note}>{c.privacy}</p>
							<label class="mt-3 flex [align-items:start] gap-3 text-[0.9rem] leading-[1.5]"
								><input
									class="mt-[3px] size-5 shrink-0 accent-cyan-ink aria-invalid:outline-2 aria-invalid:outline-[#962f24] {focusRing}"
									type="checkbox"
									name="consent"
									value={c.consent}
									required
									bind:checked={consent}
									aria-invalid={invalid('consent')}
									aria-describedby={described('consent')}
									onchange={(event) => flow.revalidate(event.currentTarget, messages)}
								/><span
									>{c.consent}<span class={marker} aria-hidden="true">*</span>{@render fieldError(
										'consent'
									)}</span
								></label
							>
						</div>
					</fieldset>
					{#if Object.keys(flow.errors).length}<p class={alertBox} role="alert">
							{f.errorSummary}
						</p>{/if}
					{#if error}<p class={alertBox} role="alert" data-alert>{error}</p>{/if}
					<!-- Pinned to the bottom of the screen, so Next and Send are always in reach. -->
					<div
						class="sticky bottom-0 z-10 -mx-(--pad) border-t border-t-ink/15 bg-white px-(--pad) py-3"
					>
						<div class="flex items-center justify-between gap-3">
							{#if flow.step > 0}<button
									class={ghost}
									type="button"
									onclick={back}
									disabled={submitting}
									><span class="flex [transform:scaleX(-1)]"><Arrow size={20} /></span><span
										class="bp-480:sr-only">{f.previous}</span
									></button
								>{:else}<span></span>{/if}
							<button class={submit} type="submit" disabled={submitting}
								>{#if flow.step < flow.last}{flow.returnTo === null
										? f.next
										: f.backToReview}{:else}{submitting
										? c.submitting
										: c.submit}{/if}{#if !submitting}<Arrow />{/if}</button
							>
						</div>
						{#if submitting}<p class="mt-2 {note}" aria-live="polite">{c.sendingNote}</p>{/if}
					</div>
					<div class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-0">
						<span class="group/tip relative inline-flex items-center gap-1.5">
							<SaveStatus status={flow.status} savingText={f.saving} savedText={f.saved} />
							{#if f.draftNote}<span class="inline-flex">
									<button
										type="button"
										class="grid size-9 cursor-help place-items-center rounded-full border-0 bg-transparent p-0 text-ink-soft hover:text-ink {focusRing}"
										aria-label="How saving works"
										aria-describedby="draft-note"
										><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"
											><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4" /><path
												d="M8 7v4.5M8 4.5v.01"
												stroke="currentColor"
												stroke-width="1.6"
												stroke-linecap="round"
											/></svg
										></button
									><span
										id="draft-note"
										role="tooltip"
										class="pointer-events-none invisible absolute bottom-full left-0 z-20 mb-1 w-[min(17rem,calc(100vw-3rem))] rounded-[3px] bg-night px-3 py-2 text-[0.8125rem]/[1.5] text-bone opacity-0 [transition:opacity_0.15s] group-focus-within/tip:visible group-focus-within/tip:opacity-100 group-hover/tip:visible group-hover/tip:opacity-100"
										>{f.draftNote}</span
									></span
								>{/if}
						</span>
						{#if flow.hasProgress}<button
								class="inline-flex min-h-9 cursor-pointer items-center border-0 bg-transparent p-0 text-[0.8125rem] text-ink underline decoration-cyan decoration-2 underline-offset-4 hover:text-cyan-deep {focusRing}"
								type="button"
								onclick={clearAnswers}
								disabled={submitting}>{f.clearDraft}</button
							>{/if}
					</div>
				</form>{/if}
		</div>
	</div>
</div>

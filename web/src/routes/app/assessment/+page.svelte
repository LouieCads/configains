<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Send from '@lucide/svelte/icons/send';
	import { onMount, tick } from 'svelte';
	import { enhance } from '$app/forms';
	import { experienceLevels, goals, trainingLocations, dayRange } from '$lib/coaching/options';
	import { clientSexOptions, healthFlags } from '$lib/coaching/assessment';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import {
		card,
		clientPage,
		error,
		help,
		primary,
		requiredMark,
		secondary
	} from '$lib/features/cms/styles';
	import FormProgress from '$lib/features/forms/FormProgress.svelte';
	import StepNav from '$lib/features/forms/StepNav.svelte';
	import { StepFlow } from '$lib/features/forms/step-flow.svelte';
	let { form } = $props();
	let busy = $state(false);
	let mounted = $state(false);
	let formElement = $state<HTMLFormElement>();
	let health = $state<string[]>([]);
	const days = Array.from({ length: dayRange[1] - dayRange[0] + 1 }, (_, i) => dayRange[0] + i);

	// One question (or two closely related ones) per step, so there is nothing to scroll through.
	const stepNames = ['Goal', 'Experience', 'Training', 'Program variant', 'Health'];
	// No draft is kept: these answers include health information, so nothing is stored on the device.
	const flow = new StepFlow({
		key: 'configains:client-assessment',
		steps: stepNames.length,
		fields: ['goal', 'experience', 'training_location', 'days_per_week', 'sex'],
		storage: () => null
	});
	const messages = { required: 'Choose an answer to continue.', email: '' };
	const onLast = $derived(flow.step === flow.last);

	onMount(() => {
		mounted = true;
	});

	const stepRoot = (index: number) =>
		formElement?.querySelector<HTMLElement>(`[data-step="${index}"]`) ?? null;
	/** After a step change: bring the form into view and move focus to the new question. */
	async function moved() {
		await tick();
		formElement?.querySelector<HTMLElement>('[data-step]:not([hidden]) legend')?.focus({
			preventScroll: true
		});
		const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
		formElement?.scrollIntoView({ block: 'start', behavior: calm ? 'auto' : 'smooth' });
	}
	async function next() {
		if (flow.next(stepRoot(flow.step), messages)) await moved();
	}
	async function previous() {
		flow.previous();
		await moved();
	}
	async function jump(step: number) {
		flow.jump(step);
		await moved();
	}
	/** Checks every step before sending. Sends the person to the first step with a missing answer. */
	function allAnswered() {
		for (let index = 0; index <= flow.last; index++) {
			if (flow.validate(stepRoot(index), messages)) continue;
			flow.edit(index);
			flow.returnTo = null;
			return false;
		}
		return true;
	}
	const choice = 'my-2 flex min-h-11 items-center gap-3';
	const hidden = (index: number) => mounted && flow.step !== index;
</script>

<svelte:head
	><title>Coaching assessment | Configains</title><meta
		name="robots"
		content="noindex, nofollow"
	/></svelte:head
>
<main class="{clientPage} mx-auto grid max-w-[640px] gap-6 p-6">
	<h1>Coaching assessment</h1>
	<p>
		Your answers choose from Cash's approved programs. Health answers mean Cash reviews your plan
		personally.<Tooltip
			label="About this assessment"
			text="Nothing here replaces medical advice."
		/>
	</p>

	{#if mounted}
		<div class="grid gap-3">
			<FormProgress
				current={flow.step + 1}
				total={stepNames.length}
				counterText={'Question {current} of {total}'}
				percentText={'{percent}% complete'}
				label="Assessment progress"
			/>
			<StepNav
				labels={stepNames}
				current={flow.step}
				reached={flow.reached}
				onjump={jump}
				label="Assessment questions"
			/>
		</div>
	{/if}

	<!-- Without JavaScript every question shows at once and the form still sends in one go. -->
	<form
		bind:this={formElement}
		method="POST"
		novalidate
		class="grid scroll-mt-6 gap-6"
		use:enhance={({ cancel }) => {
			if (mounted && !onLast) {
				cancel();
				void next();
				return;
			}
			if (mounted && !allAnswered()) {
				cancel();
				void moved();
				return;
			}
			busy = true;
			return async ({ update }) => {
				await update();
				busy = false;
			};
		}}
	>
		{#if form?.message}<p class={error} role="alert">{form.message}</p>{/if}

		<section data-step="0" hidden={hidden(0)}>
			<fieldset class={card}>
				<legend tabindex="-1"
					>What is your main goal?<span class={requiredMark} aria-hidden="true">*</span></legend
				>
				{#each goals as goal (goal.value)}
					<label class={choice}>
						<input
							type="radio"
							name="goal"
							value={goal.value}
							required
							bind:group={flow.values.goal}
						/>
						{goal.label}
					</label>
				{/each}
				{#if flow.errors.goal}<p class={error} role="alert">{flow.errors.goal}</p>{/if}
			</fieldset>
		</section>

		<section data-step="1" hidden={hidden(1)}>
			<fieldset class={card}>
				<legend tabindex="-1"
					>How would you describe your training experience?<span
						class={requiredMark}
						aria-hidden="true">*</span
					></legend
				>
				{#each experienceLevels as level (level.value)}
					<label class={choice}>
						<input
							type="radio"
							name="experience"
							value={level.value}
							required
							bind:group={flow.values.experience}
						/>
						{level.label}
					</label>
				{/each}
				{#if flow.errors.experience}<p class={error} role="alert">{flow.errors.experience}</p>{/if}
			</fieldset>
		</section>

		<section data-step="2" hidden={hidden(2)} class="grid gap-6">
			<fieldset class={card}>
				<legend tabindex="-1"
					>Where will you train?<span class={requiredMark} aria-hidden="true">*</span></legend
				>
				{#each trainingLocations as location (location.value)}
					<label class={choice}>
						<input
							type="radio"
							name="training_location"
							value={location.value}
							required
							bind:group={flow.values.training_location}
						/>
						{location.label}
					</label>
				{/each}
				{#if flow.errors.training_location}<p class={error} role="alert">
						{flow.errors.training_location}
					</p>{/if}
			</fieldset>
			<fieldset class={card}>
				<legend
					>How many days a week can you train?<span class={requiredMark} aria-hidden="true">*</span
					></legend
				>
				<select name="days_per_week" required bind:value={flow.values.days_per_week}>
					<option value="">Choose</option>
					{#each days as day (day)}
						<option value={String(day)}>{day} days</option>
					{/each}
				</select>
				{#if flow.errors.days_per_week}<p class={error} role="alert">
						{flow.errors.days_per_week}
					</p>{/if}
			</fieldset>
		</section>

		<section data-step="3" hidden={hidden(3)}>
			<fieldset class={card}>
				<legend tabindex="-1"
					>Which program variant fits you?<span class={requiredMark} aria-hidden="true">*</span
					></legend
				>
				<p class={help}>Used only to choose the approved program variant.</p>
				{#each clientSexOptions as option (option.value)}
					<label class={choice}>
						<input
							type="radio"
							name="sex"
							value={option.value}
							required
							bind:group={flow.values.sex}
						/>
						{option.label}
					</label>
				{/each}
				{#if flow.errors.sex}<p class={error} role="alert">{flow.errors.sex}</p>{/if}
			</fieldset>
		</section>

		<section data-step="4" hidden={hidden(4)}>
			<fieldset class={card}>
				<legend tabindex="-1">Do any of these apply to you?</legend>
				<p class={help}>Select all that apply. If none do, leave them unticked.</p>
				{#each healthFlags as flag (flag.value)}
					<label class={choice}>
						<input type="checkbox" name="health" value={flag.value} bind:group={health} />
						{flag.label}
					</label>
				{/each}
			</fieldset>
		</section>

		<div class="flex flex-wrap items-center justify-between gap-3">
			{#if mounted && flow.step > 0}
				<button type="button" class={secondary} onclick={previous}
					><ArrowLeft size={18} aria-hidden="true" />Previous</button
				>
			{:else}<span></span>{/if}
			{#if !mounted || onLast}
				<button class={primary} disabled={busy}
					><Send size={18} aria-hidden="true" />{busy ? 'Saving…' : 'Submit answers'}</button
				>
			{:else}
				<button type="button" class={primary} onclick={next}
					>Next<ArrowRight size={18} aria-hidden="true" /></button
				>
			{/if}
		</div>
	</form>
</main>

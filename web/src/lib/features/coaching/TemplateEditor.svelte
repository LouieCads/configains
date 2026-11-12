<script lang="ts">
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
	import Copy from '@lucide/svelte/icons/copy';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Plus from '@lucide/svelte/icons/plus';
	import Save from '@lucide/svelte/icons/save';
	import LibraryBig from '@lucide/svelte/icons/library-big';
	import Trash2 from '@lucide/svelte/icons/trash';
	import { tick, untrack } from 'svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import Rows3 from '@lucide/svelte/icons/rows-3';
	import Equal from '@lucide/svelte/icons/equal';
	import X from '@lucide/svelte/icons/x';
	import { beforeNavigate } from '$app/navigation';
	import {
		experienceLevels,
		trainingLocations,
		sexVariants,
		type Goal
	} from '$lib/coaching/options';
	import {
		goals,
		rirHelp,
		templateKinds,
		type ExerciseInput,
		type PhaseInput,
		type TemplateInput,
		type TemplateKind,
		type TemplateRules
	} from '$lib/coaching/template';
	import {
		card,
		error,
		help,
		primary,
		secondary,
		subtle,
		subtleDanger,
		success,
		requiredMark
	} from '$lib/features/cms/styles';
	import FormProgress from '$lib/features/forms/FormProgress.svelte';
	import type { Control } from '$lib/features/forms/progress';
	import { StepFlow } from '$lib/features/forms/step-flow.svelte';

	let {
		initial,
		isNew,
		message = null,
		saved = false,
		clientCopy = false,
		clientName = 'this client',
		libraryId = null,
		libraryNames = []
	}: {
		initial: TemplateInput;
		isNew: boolean;
		message?: string | null;
		saved?: boolean;
		clientName?: string;
		/** Set after "Save as template": the new library template's id. */
		libraryId?: string | null;
		/** Exercise library names, suggested while typing. A matching name shows its demo to clients. */
		libraryNames?: string[];
		/** A client's private copy: matching rules and archiving do not apply. */
		clientCopy?: boolean;
	} = $props();

	// The whole template lives here and is posted as one JSON payload, so a save is one transaction.
	// svelte-ignore state_referenced_locally
	let template = $state<TemplateInput>(normalised(structuredClone(initial)));

	/** Fills fields added after a template was saved (or kept from an older draft). */
	function normalised(value: TemplateInput): TemplateInput {
		for (const phase of value.phases) {
			phase.duration_weeks ??= null;
			for (const exercise of phase.exercises) {
				exercise.rir ??= null;
				exercise.set_plan ??= [];
			}
		}
		return value;
	}
	const isWorkout = $derived(template.kind === 'workout');

	/** A new exercise repeats the previous one's sets, reps and rest, which usually stay the same. */
	const blankExercise = (previous?: ExerciseInput): ExerciseInput => ({
		name: '',
		sets: previous?.sets ?? 3,
		reps: previous?.set_plan.length ? '' : (previous?.reps ?? ''),
		rir: previous?.set_plan.length ? null : (previous?.rir ?? null),
		set_plan: [],
		rest_seconds: previous?.rest_seconds ?? 90,
		notes: null
	});

	const maxSets = 20;
	/** Turns on per-set targets, starting every set from the current reps and RIR. */
	function varySets(exercise: ExerciseInput) {
		const count = Math.min(Math.max(exercise.sets ?? 3, 2), maxSets);
		exercise.set_plan = Array.from({ length: count }, () => ({
			reps: exercise.reps || null,
			rir: exercise.rir || null
		}));
		exercise.sets = count;
	}
	/** Back to one target for every set, keeping the first set's values. */
	function sameSets(exercise: ExerciseInput) {
		const first = exercise.set_plan[0];
		exercise.sets = exercise.set_plan.length || exercise.sets;
		exercise.reps = first?.reps ?? exercise.reps;
		exercise.rir = first?.rir ?? exercise.rir;
		exercise.set_plan = [];
	}
	function addSet(exercise: ExerciseInput) {
		if (exercise.set_plan.length >= maxSets) return;
		const last = exercise.set_plan.at(-1);
		exercise.set_plan.push({ reps: last?.reps ?? null, rir: last?.rir ?? null });
		exercise.sets = exercise.set_plan.length;
	}
	function removeSet(exercise: ExerciseInput, index: number) {
		exercise.set_plan.splice(index, 1);
		exercise.sets = exercise.set_plan.length;
		if (exercise.set_plan.length <= 1) sameSets(exercise);
	}
	async function addExercise(phase: PhaseInput, p: number) {
		phase.exercises.push(blankExercise(phase.exercises.at(-1)));
		await tick();
		const last = phase.exercises.length - 1;
		form?.querySelector<HTMLInputElement>(`[name="phase-${p}-exercise-${last}-name"]`)?.focus();
	}
	/** Copies a phase without row ids, so the copy saves as new rows, right after the original. */
	function duplicatePhase(p: number) {
		const source = $state.snapshot(template.phases[p]);
		template.phases.splice(p + 1, 0, {
			name: `${source.name} (copy)`.slice(0, 120),
			instructions: source.instructions,
			duration_weeks: source.duration_weeks,
			exercises: source.exercises.map((exercise) => ({ ...exercise, id: undefined }))
		});
	}
	const blankPhase = (): PhaseInput => ({
		name: `Phase ${template.phases.length + 1}`,
		instructions: null,
		duration_weeks: null,
		exercises: []
	});

	function move<T>(items: T[], index: number, direction: -1 | 1) {
		const target = index + direction;
		if (target < 0 || target >= items.length) return;
		[items[index], items[target]] = [items[target], items[index]];
	}

	function remove<T>(items: T[], index: number) {
		items.splice(index, 1);
	}

	// A new template is filled in over several steps; an existing one is edited on one page.
	// Nutrition templates have no "who it suits" step.
	type StepKey = 'basics' | 'suits' | 'phases' | 'review';
	const stepsFor = (kind: TemplateKind): StepKey[] =>
		kind === 'workout' ? ['basics', 'suits', 'phases', 'review'] : ['basics', 'phases', 'review'];
	const stepKeys = $derived(stepsFor(template.kind));
	const stepTitles: Record<StepKey, string> = {
		basics: 'Template details',
		suits: 'Who this program suits',
		phases: 'Phases',
		review: 'Review and save'
	};

	const flow = new StepFlow({
		key: 'configains:template-wizard',
		steps: stepsFor(template.kind).length,
		// Answers are bound to `template`, and a half-finished template is not kept as a draft.
		fields: [],
		storage: () => null
	});
	// A rejected save returns to the review step, where Save is.
	// svelte-ignore state_referenced_locally
	if (isNew && message) {
		flow.step = flow.last;
		flow.reached = flow.last;
	}
	$effect.pre(() => {
		const count = stepKeys.length;
		untrack(() => flow.setSteps(count));
	});

	const messages = { required: 'Check this field.', email: 'Enter a valid email address.' };
	const counterText = 'Step {current} of {total}';
	const percentText = '{percent}% complete';

	let form = $state<HTMLFormElement>();
	let notice = $state('');
	let saving = $state(false);
	/** Client copies only: shows the name field for a new library template. */
	let asTemplate = $state(false);
	// svelte-ignore state_referenced_locally
	let libraryName = $state(initial.name);
	const currentKey = $derived(stepKeys[flow.step]);
	const stepIndex = (key: StepKey) => stepKeys.indexOf(key);

	/** Marks a field and points it at its message. */
	const aria = (name: string) =>
		flow.errors[name]
			? { 'aria-invalid': 'true' as const, 'aria-describedby': `${name}-error` }
			: {};
	const recheck = (event: Event) => flow.revalidate(event.currentTarget as Control, messages);

	/** Problems the browser's own checks cannot see. Returns a message, or an empty string. */
	function problem(key: StepKey): string {
		if (key === 'suits') {
			const { days_min: min, days_max: max } = template.rules;
			if (min != null && max != null && min > max)
				return 'Minimum days cannot be more than maximum days.';
		}
		if (key === 'phases' && template.phases.length === 0) return 'Add at least one phase.';
		return '';
	}

	const stepRoot = (key: StepKey) =>
		form?.querySelector<HTMLElement>(`[data-step="${key}"]`) ?? null;
	function scrollToForm() {
		const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
		form?.scrollIntoView({ block: 'start', behavior: calm ? 'auto' : 'smooth' });
	}
	/** After a step change: show the top of the form and move focus to the new step's heading. */
	async function moved() {
		notice = '';
		await tick();
		form?.querySelector<HTMLElement>('[data-step]:not([hidden]) legend')?.focus({
			preventScroll: true
		});
		scrollToForm();
	}
	async function advance() {
		const key = currentKey;
		notice = '';
		if (!flow.validate(stepRoot(key), messages)) return;
		notice = problem(key);
		if (notice) return;
		flow.next(stepRoot(key), messages);
		await moved();
	}
	async function back() {
		flow.previous();
		await moved();
	}
	async function edit(key: StepKey) {
		flow.edit(stepIndex(key));
		await moved();
	}
	/** Goes back to an earlier step that needs fixing and shows what is wrong. */
	async function showProblem(index: number) {
		const key = stepKeys[index];
		flow.jump(index);
		await tick();
		flow.validate(stepRoot(key), messages);
		notice = problem(key);
		scrollToForm();
	}

	function submit(event: SubmitEvent) {
		if (!isNew) {
			saving = true;
			return;
		}
		// Enter inside a field on an earlier step goes to the next step.
		if (flow.step < flow.last) {
			event.preventDefault();
			void advance();
			return;
		}
		// Check every step again, so nothing slips through on the way to saving.
		for (let index = 0; index < flow.last; index++) {
			const key = stepKeys[index];
			if (flow.validate(stepRoot(key), messages) && !problem(key)) continue;
			event.preventDefault();
			void showProblem(index);
			return;
		}
		saving = true;
	}

	// Nutrition templates keep no exercises or rules, even if some were entered before switching type.
	const payload = $derived(
		isWorkout
			? template
			: { ...template, rules: {}, phases: template.phases.map((p) => ({ ...p, exercises: [] })) }
	);

	// Warn before leaving with unsaved edits. After a rejected save, the edits are unsaved too.
	// Empty values are left out, so a select filling in "Any" on load is not an edit.
	const fingerprint = (value: unknown) =>
		JSON.stringify(value, (_key, item) => (item === '' || item === null ? undefined : item));
	// svelte-ignore state_referenced_locally
	const savedJson = message ? '' : fingerprint(initial);
	const dirty = $derived(fingerprint(template) !== savedJson);
	beforeNavigate((navigation) => {
		if (saving || !dirty || navigation.type === 'form') return;
		// Closing the tab or a full reload: the browser shows its own prompt.
		if (navigation.willUnload) {
			navigation.cancel();
			return;
		}
		if (!confirm('Leave without saving? Your changes to this template will be lost.'))
			navigation.cancel();
	});

	const labelOf = (list: readonly { value: string; label: string }[], value: string | undefined) =>
		list.find((item) => item.value === value)?.label ?? 'Any';
	function daysLabel(rules: TemplateRules) {
		const { days_min: min, days_max: max } = rules;
		if (min != null && max != null)
			return min === max ? `${min} days a week` : `${min} to ${max} days a week`;
		if (min != null) return `At least ${min} days a week`;
		if (max != null) return `Up to ${max} days a week`;
		return 'Any';
	}
	type SummaryGroup = {
		key: StepKey;
		title: string;
		items: { label: string; value: string; wide?: boolean }[];
	};
	const summary: SummaryGroup[] = $derived([
		{
			key: 'basics' as const,
			title: stepTitles.basics,
			items: [
				{ label: 'Type', value: labelOf(templateKinds, template.kind) },
				{ label: 'Name', value: template.name.trim() || 'Not set' },
				{ label: 'Goal', value: labelOf(goals, template.goal as Goal) },
				{ label: 'Description', value: template.description?.trim() || 'None', wide: true }
			]
		},
		...(isWorkout
			? [
					{
						key: 'suits' as const,
						title: stepTitles.suits,
						items: [
							{ label: 'Experience', value: labelOf(experienceLevels, template.rules.experience) },
							{
								label: 'Training location',
								value: labelOf(trainingLocations, template.rules.training_location)
							},
							{ label: 'Program variant', value: labelOf(sexVariants, template.rules.sex) },
							{ label: 'Days a week', value: daysLabel(template.rules) }
						]
					}
				]
			: [])
	]);
	const exerciseCount = (phase: PhaseInput) =>
		`${phase.exercises.length} exercise${phase.exercises.length === 1 ? '' : 's'}`;

	const legend = 'mb-3 p-0 font-studio text-[1.75rem]/none focus:outline-hidden';
	const note = 'text-[0.8rem] leading-[1.4] text-muted';
</script>

{#snippet fieldError(name: string)}
	{#if flow.errors[name]}<span
			id="{name}-error"
			class="text-[0.8125rem] leading-[1.5] font-normal text-[#962f24]"
			aria-hidden="true">{flow.errors[name]}</span
		>{/if}
{/snippet}

{#snippet details()}
	{#if isNew}
		<label class="my-2 grid gap-1"
			><span>Type<span class={requiredMark} aria-hidden="true">*</span></span>
			<select name="template-kind" required bind:value={template.kind}>
				{#each templateKinds as kind (kind.value)}
					<option value={kind.value}>{kind.label}</option>
				{/each}
			</select>
		</label>
	{:else}
		<p class={help}>{isWorkout ? 'Workout' : 'Nutrition'} template</p>
	{/if}
	<label class="my-2 grid gap-1"
		><span>Name<span class={requiredMark} aria-hidden="true">*</span></span>
		<input
			name="template-name"
			bind:value={template.name}
			maxlength="120"
			required
			oninput={recheck}
			{...aria('template-name')}
		/>
		{@render fieldError('template-name')}
	</label>
	<label class="my-2 grid gap-1"
		><span>Goal<span class={requiredMark} aria-hidden="true">*</span></span>
		<select name="template-goal" required bind:value={template.goal}>
			{#each goals as goal (goal.value)}
				<option value={goal.value}>{goal.label}</option>
			{/each}
		</select>
	</label>
	<label class="my-2 grid gap-1"
		>Description (shown to coaches only)
		<textarea
			name="template-description"
			bind:value={template.description}
			rows="2"
			maxlength="1000"></textarea>
	</label>
	{#if !isNew && !clientCopy}
		<label class="my-2 flex items-center gap-2">
			<input type="checkbox" bind:checked={template.is_archived} /> Archived (cannot be newly assigned)
		</label>
	{/if}
{/snippet}

{#snippet suits()}
	<p class={help}>
		Clients are matched only to programs that fit their answers. Leave a field on Any to match
		everyone.
	</p>
	<label class="my-2 grid gap-1"
		>Experience
		<select name="rule-experience" bind:value={template.rules.experience}>
			<option value="">Any</option>
			{#each experienceLevels as level (level.value)}
				<option value={level.value}>{level.label}</option>
			{/each}
		</select>
	</label>
	<label class="my-2 grid gap-1"
		>Training location
		<select name="rule-location" bind:value={template.rules.training_location}>
			<option value="">Any</option>
			{#each trainingLocations as location (location.value)}
				<option value={location.value}>{location.label}</option>
			{/each}
		</select>
	</label>
	<label class="my-2 grid gap-1"
		>Program variant
		<select name="rule-variant" bind:value={template.rules.sex}>
			<option value="">Any</option>
			{#each sexVariants as variant (variant.value)}
				<option value={variant.value}>{variant.label}</option>
			{/each}
		</select>
	</label>
	<div class="grid grid-cols-2 gap-x-4 bp-480:grid-cols-1">
		<label class="my-2 grid gap-1"
			>Minimum days a week
			<input
				name="rule-days-min"
				type="number"
				min="2"
				max="6"
				step="1"
				bind:value={template.rules.days_min}
				oninput={recheck}
				{...aria('rule-days-min')}
			/>
			{@render fieldError('rule-days-min')}
		</label>
		<label class="my-2 grid gap-1"
			>Maximum days a week
			<input
				name="rule-days-max"
				type="number"
				min="2"
				max="6"
				step="1"
				bind:value={template.rules.days_max}
				oninput={recheck}
				{...aria('rule-days-max')}
			/>
			{@render fieldError('rule-days-max')}
		</label>
	</div>
{/snippet}

{#snippet phases()}
	{#each template.phases as phase, p (p)}
		<section class={isNew ? 'mb-4 rounded-[10px] border border-line p-4' : card}>
			<div class="flex flex-wrap items-center gap-1">
				<h2 class="mr-auto mb-0">Phase {p + 1}</h2>
				<button
					type="button"
					class={subtle}
					onclick={() => move(template.phases, p, -1)}
					disabled={p === 0}
					aria-label="Move phase {p + 1} up"><ArrowUp size={16} aria-hidden="true" /></button
				>
				<button
					type="button"
					class={subtle}
					onclick={() => move(template.phases, p, 1)}
					disabled={p === template.phases.length - 1}
					aria-label="Move phase {p + 1} down"><ArrowDown size={16} aria-hidden="true" /></button
				>
				<button type="button" class={subtle} onclick={() => duplicatePhase(p)}
					><Copy size={16} aria-hidden="true" />Duplicate<span class="sr-only">
						phase {p + 1}</span
					></button
				>
				<button type="button" class={subtleDanger} onclick={() => remove(template.phases, p)}
					><Trash2 size={16} aria-hidden="true" />Remove<span class="sr-only">
						phase {p + 1}</span
					></button
				>
			</div>
			<div class="grid grid-cols-[minmax(0,1fr)_9rem] items-start gap-x-3 bp-480:grid-cols-1">
				<label class="my-2 grid gap-1"
					><span>Phase name<span class={requiredMark} aria-hidden="true">*</span></span>
					<input
						name="phase-{p}-name"
						bind:value={phase.name}
						maxlength="120"
						required
						oninput={recheck}
						{...aria(`phase-${p}-name`)}
					/>
					{@render fieldError(`phase-${p}-name`)}
				</label>
				<label class="my-2 grid gap-1"
					>Length (weeks)
					<input
						name="phase-{p}-weeks"
						type="number"
						min="1"
						max="52"
						step="1"
						bind:value={phase.duration_weeks}
						oninput={recheck}
						{...aria(`phase-${p}-weeks`)}
					/>
					{@render fieldError(`phase-${p}-weeks`)}
				</label>
			</div>
			{#if isWorkout && p === 0}
				<p class="{help} mt-0!">
					With a length set, your dashboard reminds you when a client is due for the next phase.
				</p>
			{/if}
			<label class="my-2 grid gap-1"
				>Instructions for clients
				<textarea bind:value={phase.instructions} rows="2" maxlength="2000"></textarea>
			</label>

			{#if isWorkout}
				<h3 class="mt-4 mb-2 text-[0.8rem] font-bold tracking-[1px] text-muted uppercase">
					Exercises ({phase.exercises.length})
				</h3>
				<ol class="m-0 grid list-none gap-2 p-0">
					{#each phase.exercises as exercise, e (e)}
						{@const varied = exercise.set_plan.length > 0}
						<li class="grid gap-2 rounded-lg border border-[#b7c6c7] p-3">
							<div
								class="grid grid-cols-[minmax(0,1fr)_4.5rem_6rem_5rem_5.5rem_auto] items-end gap-2 bp-760:grid-cols-3"
							>
								<label class="grid gap-1 text-[0.8rem] bp-760:col-span-3"
									><span
										>Exercise {e + 1}<span class={requiredMark} aria-hidden="true">*</span></span
									>
									<input
										name="phase-{p}-exercise-{e}-name"
										bind:value={exercise.name}
										maxlength="120"
										required
										placeholder="e.g. Goblet squat"
										list={libraryNames.length ? 'exercise-library-names' : undefined}
										autocomplete="off"
										oninput={recheck}
										{...aria(`phase-${p}-exercise-${e}-name`)}
									/>
								</label>
								<label class="grid gap-1 text-[0.8rem]"
									>Sets
									<input
										name="phase-{p}-exercise-{e}-sets"
										type="number"
										min="1"
										max="20"
										step="1"
										bind:value={exercise.sets}
										disabled={varied}
										title={varied ? 'Add or remove sets below' : undefined}
										oninput={recheck}
										{...aria(`phase-${p}-exercise-${e}-sets`)}
									/>
								</label>
								{#if varied}
									<p class="col-span-2 m-0 self-center text-[0.8rem] text-muted bp-760:col-span-2">
										Reps and RIR are set per set below.
									</p>
								{:else}
									<label class="grid gap-1 text-[0.8rem]"
										>Reps
										<input bind:value={exercise.reps} maxlength="40" placeholder="8-10" />
									</label>
									<label class="grid gap-1 text-[0.8rem]"
										><span class="inline-flex items-center gap-0.5"
											>RIR<Tooltip label="What is RIR?" text={rirHelp} /></span
										>
										<input bind:value={exercise.rir} maxlength="10" placeholder="2" />
									</label>
								{/if}
								<label class="grid gap-1 text-[0.8rem]"
									>Rest (s)
									<input
										name="phase-{p}-exercise-{e}-rest"
										type="number"
										min="0"
										max="900"
										step="1"
										bind:value={exercise.rest_seconds}
										oninput={recheck}
										{...aria(`phase-${p}-exercise-${e}-rest`)}
									/>
								</label>
								<div class="flex bp-760:col-span-3 bp-760:justify-end">
									<button
										type="button"
										class={subtle}
										onclick={() => move(phase.exercises, e, -1)}
										disabled={e === 0}
										aria-label="Move exercise {e + 1} up"
										><ArrowUp size={16} aria-hidden="true" /></button
									>
									<button
										type="button"
										class={subtle}
										onclick={() => move(phase.exercises, e, 1)}
										disabled={e === phase.exercises.length - 1}
										aria-label="Move exercise {e + 1} down"
										><ArrowDown size={16} aria-hidden="true" /></button
									>
									<button
										type="button"
										class={subtleDanger}
										onclick={() => remove(phase.exercises, e)}
										aria-label="Remove exercise {e + 1}"
										><Trash2 size={16} aria-hidden="true" /></button
									>
								</div>
							</div>
							{#if varied}
								<ol class="m-0 grid list-none gap-2 p-0" aria-label="Sets for exercise {e + 1}">
									{#each exercise.set_plan as set, s (s)}
										<li
											class="grid grid-cols-[3.5rem_minmax(0,8rem)_minmax(0,6rem)_auto] items-end gap-2"
										>
											<span class="pb-3 text-[0.8rem] font-semibold">Set {s + 1}</span>
											<label class="grid gap-1 text-[0.8rem]"
												>Reps
												<input bind:value={set.reps} maxlength="40" placeholder="8-12" />
											</label>
											<label class="grid gap-1 text-[0.8rem]"
												>RIR
												<input bind:value={set.rir} maxlength="10" placeholder="2" />
											</label>
											<button
												type="button"
												class={subtleDanger}
												onclick={() => removeSet(exercise, s)}
												aria-label="Remove set {s + 1} of exercise {e + 1}"
												><X size={16} aria-hidden="true" /></button
											>
										</li>
									{/each}
								</ol>
							{/if}
							<div class="flex flex-wrap gap-1">
								{#if varied}
									<button
										type="button"
										class={subtle}
										onclick={() => addSet(exercise)}
										disabled={exercise.set_plan.length >= maxSets}
										><Plus size={16} aria-hidden="true" />Add set</button
									>
									<button type="button" class={subtle} onclick={() => sameSets(exercise)}
										><Equal size={16} aria-hidden="true" />Same for every set</button
									>
								{:else}
									<button type="button" class={subtle} onclick={() => varySets(exercise)}
										><Rows3 size={16} aria-hidden="true" />Different reps per set</button
									>
								{/if}
							</div>
							{@render fieldError(`phase-${p}-exercise-${e}-name`)}
							{@render fieldError(`phase-${p}-exercise-${e}-sets`)}
							{@render fieldError(`phase-${p}-exercise-${e}-rest`)}
							<label class="grid text-[0.8rem]"
								><span class="sr-only">Notes for exercise {e + 1}</span>
								<input bind:value={exercise.notes} maxlength="500" placeholder="Notes" />
							</label>
						</li>
					{/each}
				</ol>
				<button type="button" class="{secondary} mt-3" onclick={() => addExercise(phase, p)}
					><Plus size={18} aria-hidden="true" />Add exercise</button
				>
			{/if}
		</section>
	{/each}
{/snippet}

{#if libraryNames.length}
	<datalist id="exercise-library-names">
		{#each libraryNames as name (name)}<option value={name}></option>{/each}
	</datalist>
{/if}

<form
	method="POST"
	action="?/save"
	class="grid gap-4"
	novalidate={isNew}
	bind:this={form}
	onsubmit={submit}
>
	<input type="hidden" name="payload" value={JSON.stringify(payload)} />

	{#if message}<p class={error} role="alert">{message}</p>{/if}
	{#if saved && libraryId}
		<p class={success} role="status">
			Saved for {clientName}, and added to your Program Library as a new template.
			<a class="text-cyan-ink" href="/admin/templates/{libraryId}">Open the library template</a>
		</p>
	{:else if saved}<p class={success} role="status">
			{clientCopy ? `Saved for ${clientName}.` : 'Template saved.'}
		</p>{/if}

	{#if isNew}
		<div class="mt-3">
			<FormProgress
				current={flow.step + 1}
				total={flow.last + 1}
				{counterText}
				{percentText}
				label="New template progress"
			/>
		</div>

		<section class={card}>
			<fieldset
				class="m-0 min-w-0 border-0 p-0"
				hidden={currentKey !== 'basics'}
				data-step="basics"
			>
				<legend class={legend} tabindex="-1">{stepTitles.basics}</legend>
				{@render details()}
			</fieldset>

			{#if isWorkout}
				<fieldset
					class="m-0 min-w-0 border-0 p-0"
					hidden={currentKey !== 'suits'}
					data-step="suits"
				>
					<legend class={legend} tabindex="-1">{stepTitles.suits}</legend>
					{@render suits()}
				</fieldset>
			{/if}

			<fieldset
				class="m-0 min-w-0 border-0 p-0"
				hidden={currentKey !== 'phases'}
				data-step="phases"
			>
				<legend class={legend} tabindex="-1">{stepTitles.phases}</legend>
				<p class={help}>
					{isWorkout
						? 'Split the program into phases, then add the exercises for each one.'
						: 'Split the plan into phases and write the instructions clients follow in each one.'}
				</p>
				{@render phases()}
				<button type="button" class={secondary} onclick={() => template.phases.push(blankPhase())}
					><Plus size={18} aria-hidden="true" />Add phase</button
				>
			</fieldset>

			<fieldset
				class="m-0 min-w-0 border-0 p-0"
				hidden={currentKey !== 'review'}
				data-step="review"
			>
				<legend class={legend} tabindex="-1">{stepTitles.review}</legend>
				<p class="mb-3 {note}">Check everything below, then save. Use Edit to change a section.</p>
				{#each summary as group (group.key)}
					<section class="border-t border-line py-3" aria-labelledby="review-{group.key}">
						<div class="flex items-center justify-between gap-4">
							<h2 id="review-{group.key}" class="mb-0 text-[1.375rem]/none">{group.title}</h2>
							<button type="button" class={subtle} onclick={() => edit(group.key)}
								><Pencil size={16} aria-hidden="true" />Edit<span class="sr-only">
									{group.title}</span
								></button
							>
						</div>
						<dl class="m-0 mt-2 grid grid-cols-2 gap-x-6 gap-y-2 bp-640:grid-cols-1">
							{#each group.items as item (item.label)}
								<div class={item.wide ? 'col-span-2 bp-640:col-span-1' : ''}>
									<dt class={note}>{item.label}</dt>
									<dd class="m-0 wrap-anywhere whitespace-pre-wrap text-ink">{item.value}</dd>
								</div>
							{/each}
						</dl>
					</section>
				{/each}
				<section class="border-t border-line py-3" aria-labelledby="review-phases">
					<div class="flex items-center justify-between gap-4">
						<h2 id="review-phases" class="mb-0 text-[1.375rem]/none">
							{stepTitles.phases} ({template.phases.length})
						</h2>
						<button type="button" class={subtle} onclick={() => edit('phases')}
							><Pencil size={16} aria-hidden="true" />Edit<span class="sr-only">
								{stepTitles.phases}</span
							></button
						>
					</div>
					<ol class="m-0 mt-2 grid list-none gap-2 p-0">
						{#each template.phases as phase, p (p)}
							<li class="flex flex-wrap items-baseline justify-between gap-x-4">
								<span class="font-semibold wrap-anywhere"
									>{phase.name.trim() || `Phase ${p + 1}`}</span
								>
								{#if isWorkout}<span class={note}>{exerciseCount(phase)}</span>{/if}
							</li>
						{/each}
					</ol>
				</section>
			</fieldset>
		</section>

		{#if notice}<p class={error} role="alert">{notice}</p>{/if}
		{#if Object.keys(flow.errors).length}<p class={error} role="alert">
				Some fields need attention before you continue.
			</p>{/if}

		<!-- Pinned to the bottom of the screen, so Back and Next are always in reach. -->
		<div
			class="sticky bottom-0 z-10 -mx-1 flex items-center justify-between gap-3 border-t border-line bg-[#f7f8f5] px-1 py-3"
		>
			{#if flow.step > 0}
				<button type="button" class={secondary} onclick={back} disabled={saving}
					><ArrowLeft size={18} aria-hidden="true" />Back</button
				>
			{:else}<span></span>{/if}
			<button class={primary} disabled={saving}
				>{#if flow.step < flow.last}{#if flow.returnTo === null}Next<ArrowRight
							size={18}
							aria-hidden="true"
						/>{:else}<ClipboardCheck size={18} aria-hidden="true" />Back to review{/if}{:else}<Save
						size={18}
						aria-hidden="true"
					/>{saving ? 'Saving…' : 'Save template'}{/if}</button
			>
		</div>
	{:else}
		<section class={card}>
			<h2>Details</h2>
			{@render details()}
		</section>

		{#if isWorkout && !clientCopy}
			<section class={card}>
				<h2>Who this program suits</h2>
				{@render suits()}
			</section>
		{/if}

		{@render phases()}

		<button
			type="button"
			class="{secondary} justify-self-start"
			onclick={() => template.phases.push(blankPhase())}
			><Plus size={18} aria-hidden="true" />Add phase</button
		>

		<!-- Pinned to the bottom of the screen, so Save is always in reach on long templates. -->
		<div
			class="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center justify-end gap-3 border-t border-line bg-[#f7f8f5] px-1 py-3"
		>
			<span class="mr-auto text-[0.85rem] text-muted" aria-live="polite"
				>{dirty ? 'Unsaved changes' : 'No unsaved changes'}</span
			>
			{#if clientCopy}
				{#if asTemplate}
					<label class="flex flex-wrap items-center gap-2 text-[0.85rem] font-semibold"
						>Library template name
						<input
							name="library_name"
							bind:value={libraryName}
							maxlength="120"
							required
							class="w-[260px] max-w-full"
						/>
					</label>
					<button class={secondary} formaction="?/saveAsTemplate" disabled={saving}
						><LibraryBig size={18} aria-hidden="true" />Create template</button
					>
					<button type="button" class={subtle} onclick={() => (asTemplate = false)}>Cancel</button>
				{:else}
					<button
						type="button"
						class={secondary}
						disabled={saving}
						title="Also saves this client's copy, then adds a reusable template to your Program Library"
						onclick={() => (asTemplate = true)}
						><LibraryBig size={18} aria-hidden="true" />Save as template</button
					>
				{/if}
			{/if}
			<button class={primary} formaction="?/save" disabled={saving || !dirty}
				><Save size={18} aria-hidden="true" />{saving
					? 'Saving…'
					: clientCopy
						? 'Save for this client'
						: 'Save template'}</button
			>
		</div>
		{#if clientCopy}
			<p class="{help} mt-0! text-right">
				Save for this client changes only {clientName}'s program. Save as template also adds a
				reusable copy to your Program Library for other clients.
			</p>
		{/if}
	{/if}
</form>

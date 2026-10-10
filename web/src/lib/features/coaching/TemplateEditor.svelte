<script lang="ts">
	import { experienceLevels, trainingLocations, sexVariants } from '$lib/coaching/options';
	import {
		goals,
		templateKinds,
		type ExerciseInput,
		type PhaseInput,
		type TemplateInput
	} from '$lib/coaching/template';
	import {
		card,
		error,
		help,
		primary,
		secondary,
		subtle,
		subtleDanger,
		success
	} from '$lib/features/cms/styles';

	let {
		initial,
		isNew,
		message = null,
		saved = false
	}: {
		initial: TemplateInput;
		isNew: boolean;
		message?: string | null;
		saved?: boolean;
	} = $props();

	// The whole template lives here and is posted as one JSON payload, so a save is one transaction.
	// svelte-ignore state_referenced_locally
	let template = $state<TemplateInput>(structuredClone(initial));
	const isWorkout = $derived(template.kind === 'workout');

	const blankExercise = (): ExerciseInput => ({
		name: '',
		sets: 3,
		reps: '',
		rest_seconds: 90,
		notes: null
	});
	const blankPhase = (): PhaseInput => ({
		name: `Phase ${template.phases.length + 1}`,
		instructions: null,
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
</script>

<form method="POST" action="?/save" class="grid gap-4">
	<input type="hidden" name="payload" value={JSON.stringify(template)} />

	{#if message}<p class={error} role="alert">{message}</p>{/if}
	{#if saved}<p class={success} role="status">Template saved.</p>{/if}

	<section class={card}>
		<h2>Details</h2>
		{#if isNew}
			<label class="my-2 grid gap-1"
				>Type
				<select bind:value={template.kind}>
					{#each templateKinds as kind (kind.value)}
						<option value={kind.value}>{kind.label}</option>
					{/each}
				</select>
			</label>
		{:else}
			<p class={help}>{isWorkout ? 'Workout' : 'Nutrition'} template</p>
		{/if}
		<label class="my-2 grid gap-1"
			>Name
			<input bind:value={template.name} maxlength="120" required />
		</label>
		<label class="my-2 grid gap-1"
			>Goal
			<select bind:value={template.goal}>
				{#each goals as goal (goal.value)}
					<option value={goal.value}>{goal.label}</option>
				{/each}
			</select>
		</label>
		<label class="my-2 grid gap-1"
			>Description (shown to coaches only)
			<textarea bind:value={template.description} rows="2" maxlength="1000"></textarea>
		</label>
		<label class="my-2 flex items-center gap-2">
			<input type="checkbox" bind:checked={template.is_archived} /> Archived (cannot be newly assigned)
		</label>
	</section>

	{#if isWorkout}
		<section class={card}>
			<h2>Who this program suits</h2>
			<p class={help}>
				Clients are matched only to programs that fit their answers. Leave a field on Any to match
				everyone.
			</p>
			<label class="my-2 grid gap-1"
				>Experience
				<select bind:value={template.rules.experience}>
					<option value="">Any</option>
					{#each experienceLevels as level (level.value)}
						<option value={level.value}>{level.label}</option>
					{/each}
				</select>
			</label>
			<label class="my-2 grid gap-1"
				>Training location
				<select bind:value={template.rules.training_location}>
					<option value="">Any</option>
					{#each trainingLocations as location (location.value)}
						<option value={location.value}>{location.label}</option>
					{/each}
				</select>
			</label>
			<label class="my-2 grid gap-1"
				>Program variant
				<select bind:value={template.rules.sex}>
					<option value="">Any</option>
					{#each sexVariants as variant (variant.value)}
						<option value={variant.value}>{variant.label}</option>
					{/each}
				</select>
			</label>
			<div class="flex flex-wrap items-end gap-2">
				<label class="my-2 grid gap-1"
					>Minimum days a week
					<input type="number" min="2" max="6" step="1" bind:value={template.rules.days_min} />
				</label>
				<label class="my-2 grid gap-1"
					>Maximum days a week
					<input type="number" min="2" max="6" step="1" bind:value={template.rules.days_max} />
				</label>
			</div>
		</section>
	{/if}

	{#each template.phases as phase, p (p)}
		<section class={card}>
			<div class="flex flex-wrap items-end gap-2">
				<h2>Phase {p + 1}</h2>
				<button
					type="button"
					class={subtle}
					onclick={() => move(template.phases, p, -1)}
					disabled={p === 0}>Up</button
				>
				<button
					type="button"
					class={subtle}
					onclick={() => move(template.phases, p, 1)}
					disabled={p === template.phases.length - 1}>Down</button
				>
				<button type="button" class={subtleDanger} onclick={() => remove(template.phases, p)}
					>Remove phase</button
				>
			</div>
			<label class="my-2 grid gap-1"
				>Phase name
				<input bind:value={phase.name} maxlength="120" required />
			</label>
			<label class="my-2 grid gap-1"
				>Instructions for clients
				<textarea bind:value={phase.instructions} rows="3" maxlength="2000"></textarea>
			</label>

			{#if isWorkout}
				{#each phase.exercises as exercise, e (e)}
					<fieldset class="my-3 rounded-lg border border-[#b7c6c7] p-3">
						<legend>Exercise {e + 1}</legend>
						<label class="my-2 grid gap-1"
							>Name
							<input bind:value={exercise.name} maxlength="120" required />
						</label>
						<div class="flex flex-wrap items-end gap-2">
							<label class="my-2 grid gap-1"
								>Sets
								<input type="number" min="1" max="20" step="1" bind:value={exercise.sets} />
							</label>
							<label class="my-2 grid gap-1"
								>Reps
								<input bind:value={exercise.reps} maxlength="40" placeholder="8-10" />
							</label>
							<label class="my-2 grid gap-1"
								>Rest (seconds)
								<input
									type="number"
									min="0"
									max="900"
									step="1"
									bind:value={exercise.rest_seconds}
								/>
							</label>
						</div>
						<label class="my-2 grid gap-1"
							>Notes
							<input bind:value={exercise.notes} maxlength="500" />
						</label>
						<div class="flex flex-wrap items-end gap-2">
							<button
								type="button"
								class={subtle}
								onclick={() => move(phase.exercises, e, -1)}
								disabled={e === 0}>Up</button
							>
							<button
								type="button"
								class={subtle}
								onclick={() => move(phase.exercises, e, 1)}
								disabled={e === phase.exercises.length - 1}>Down</button
							>
							<button type="button" class={subtleDanger} onclick={() => remove(phase.exercises, e)}
								>Remove exercise</button
							>
						</div>
					</fieldset>
				{/each}
				<button
					type="button"
					class={secondary}
					onclick={() => phase.exercises.push(blankExercise())}>Add exercise</button
				>
			{/if}
		</section>
	{/each}

	<div class="flex flex-wrap items-end gap-2">
		<button type="button" class={secondary} onclick={() => template.phases.push(blankPhase())}
			>Add phase</button
		>
		<button class={primary}>Save template</button>
	</div>
</form>

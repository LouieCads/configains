<script lang="ts">
	import { card, help, primary, secondary } from '$lib/features/cms/styles';
	import { aiDisclosureVersion } from '$lib/coaching/disclosure';
	let { data } = $props();

	const phases = $derived(data.program?.workout?.phases ?? []);
	let chosenPhaseId = $state<string | null>(null);
	const selected = $derived(
		phases.find((phase) => phase.id === (chosenPhaseId ?? data.program?.currentPhaseId)) ??
			phases[0]
	);
	const pending = $derived(data.assessmentStatus === 'submitted');
	const needsReview = $derived(data.assessmentStatus === 'needs_human_review');
	const humanRouted = $derived(data.assessmentStatus === 'human_assigned');
</script>

<svelte:head
	><title>Your coaching | Configains</title><meta
		name="robots"
		content="noindex, nofollow"
	/></svelte:head
>
<main class="mx-auto grid max-w-[640px] gap-6 p-6">
	<h1>{data.displayName ? `Welcome, ${data.displayName}.` : 'Welcome.'}</h1>
	{#if data.coachingMode === 'human'}
		<p><a class={primary} href="/app/coach">Check-ins and messages with Cash</a></p>
	{/if}

	{#if !data.program}
		<section class={card}>
			{#if needsReview || humanRouted}
				<p>
					Thanks for completing the assessment. Some of your answers need a personal review, so Cash
					will be in touch to set up your program.
				</p>
			{:else if pending}
				<p>We are reviewing your answers. Your program will appear here once it is ready.</p>
			{:else}
				<p>Your coach has not assigned a program yet.</p>
				<p class={help}>
					Complete the coaching assessment to get a program from Cash's approved options.
				</p>
				<a class={primary} href="/app/assessment">Take the coaching assessment</a>
			{/if}
		</section>
	{:else}
		{#if data.program.source === 'ai'}
			<section class={card} aria-labelledby="ai-disclosure">
				<h2 id="ai-disclosure">AI Coaching</h2>
				<p>
					AI Coaching uses general, Cash-approved templates and the answers you gave. It is not the
					same as individual coaching from Cash.
				</p>
				{#if data.program.explanation}<p>{data.program.explanation}</p>{/if}
				<p class={help}>Disclosure version {aiDisclosureVersion}.</p>
			</section>
		{/if}

		{#if data.program.workout}
			<section class={card}>
				<h2>{data.program.workout.name}</h2>
				{#if data.program.workout.description}<p>{data.program.workout.description}</p>{/if}

				<div class="my-4 flex flex-wrap gap-2" role="tablist" aria-label="Program phases">
					{#each phases as phase (phase.id)}
						<button
							type="button"
							role="tab"
							aria-selected={selected?.id === phase.id}
							class={selected?.id === phase.id ? primary : secondary}
							onclick={() => (chosenPhaseId = phase.id)}
						>
							{phase.name}{phase.id === data.program.currentPhaseId ? ' (current)' : ''}
						</button>
					{/each}
				</div>

				{#if selected}
					{#if selected.instructions}<p>{selected.instructions}</p>{/if}
					{#if selected.exercises.length === 0}
						<p class={help}>No exercises in this phase yet.</p>
					{:else}
						<ol class="grid gap-3">
							{#each selected.exercises as exercise (exercise.id)}
								<li class="rounded-lg border border-line p-3">
									<strong>{exercise.name}</strong>
									<p class={help}>
										{[
											exercise.sets ? `${exercise.sets} sets` : null,
											exercise.reps ? `${exercise.reps} reps` : null,
											exercise.rest_seconds !== null ? `${exercise.rest_seconds}s rest` : null
										]
											.filter(Boolean)
											.join(' · ')}
									</p>
									{#if exercise.notes}<p>{exercise.notes}</p>{/if}
								</li>
							{/each}
						</ol>
					{/if}
				{/if}
			</section>
		{/if}

		{#if data.program.nutrition}
			<section class={card}>
				<h2>{data.program.nutrition.name}</h2>
				{#if data.program.nutrition.description}<p>{data.program.nutrition.description}</p>{/if}
				{#each data.program.nutrition.phases as phase (phase.id)}
					<div class="my-3">
						<h3>{phase.name}</h3>
						{#if phase.instructions}<p>{phase.instructions}</p>{/if}
					</div>
				{/each}
				<p class={help}>
					Nutrition guidance supports general fitness and wellness. It is not medical advice.
				</p>
			</section>
		{/if}
	{/if}
</main>

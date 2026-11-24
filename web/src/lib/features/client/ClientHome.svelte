<script lang="ts">
	import MessagesSquare from '@lucide/svelte/icons/messages-square';
	import Dumbbell from '@lucide/svelte/icons/dumbbell';
	import TrendingUp from '@lucide/svelte/icons/trending-up';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import { onMount } from 'svelte';
	import {
		card,
		clientPage,
		help,
		primary,
		secondary,
		tabIdle,
		tabSelected
	} from '$lib/features/cms/styles';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import ExerciseDemo from '$lib/features/coaching/ExerciseDemo.svelte';
	import { weekStatus } from '$lib/coaching/dashboard';
	import { hasCardioTarget, hasNutritionTarget, hasStepTarget } from '$lib/coaching/targets';
	import NutritionCard from '$lib/features/progress/NutritionCard.svelte';
	import WeekPlan from '$lib/features/progress/WeekPlan.svelte';
	import { prescriptionFacts, rirHelp, type PrescriptionFact } from '$lib/coaching/template';
	import FactList, { type Fact } from '$lib/components/FactList.svelte';
	import Gauge from '@lucide/svelte/icons/gauge';
	import Layers from '@lucide/svelte/icons/layers';
	import Repeat from '@lucide/svelte/icons/repeat';
	import Timer from '@lucide/svelte/icons/timer';
	import { aiDisclosureVersion } from '$lib/coaching/disclosure';
	import type { loadClientHome } from '$lib/server/coaching/client-view';
	type Data = Awaited<ReturnType<typeof loadClientHome>>;
	// `base` is where the client pages live: /app for the client, the coach's preview path otherwise.
	let { data, base = '/app' }: { data: Data; base?: string } = $props();

	const factIcons = { sets: Layers, reps: Repeat, rir: Gauge, rest: Timer } as const;
	const toFacts = (facts: PrescriptionFact[]): Fact[] =>
		facts.map((fact) => ({ ...fact, icon: factIcons[fact.kind] }));
	/** What one set asks for: the reps and the effort left in the tank. */
	const setFacts = (set: { reps?: string | null; rir?: string | null }): Fact[] => {
		const facts: (Fact | null)[] = [
			set.reps ? { icon: Repeat, value: String(set.reps), trail: 'reps' } : null,
			set.rir ? { icon: Gauge, value: String(set.rir), lead: 'RIR' } : null
		];
		return facts.filter((fact): fact is Fact => fact !== null);
	};

	const phases = $derived(data.program?.workout?.phases ?? []);
	let chosenPhaseId = $state<string | null>(null);
	const selected = $derived(
		phases.find((phase) => phase.id === (chosenPhaseId ?? data.program?.currentPhaseId)) ??
			phases[0]
	);
	const isCurrent = $derived(selected?.id === data.program?.currentPhaseId);
	const pending = $derived(data.assessmentStatus === 'submitted');
	const needsReview = $derived(data.assessmentStatus === 'needs_human_review');
	const humanRouted = $derived(data.assessmentStatus === 'human_assigned');

	// "This week" follows the client's own date, not the server's (UTC).
	// svelte-ignore state_referenced_locally
	let today = $state(data.today);
	onMount(() => {
		today = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000)
			.toISOString()
			.slice(0, 10);
	});
	const snapshot = $derived(data.snapshot);
	const week = $derived(
		snapshot
			? weekStatus(
					{ logs: snapshot.logs, metrics: [], steps: snapshot.steps, cardio: snapshot.cardio },
					snapshot.targets,
					today
				)
			: null
	);
	// Only show the week when there is something to do or something logged, so a new client sees no empty card.
	const showWeek = $derived(
		Boolean(
			snapshot &&
			(hasStepTarget(snapshot.targets) ||
				hasCardioTarget(snapshot.targets) ||
				snapshot.steps.length > 0 ||
				snapshot.cardio.length > 0)
		)
	);
</script>

<svelte:head
	><title>Your coaching | Configains</title><meta
		name="robots"
		content="noindex, nofollow"
	/></svelte:head
>
<main class="{clientPage} mx-auto grid max-w-[640px] gap-6 p-6">
	<h1>{data.displayName ? `Welcome, ${data.displayName}.` : 'Welcome.'}</h1>

	<!-- Logging and progress do not wait for a program: steps, cardio and weight count from day one. -->
	<nav class="flex flex-wrap gap-3" aria-label="Your coaching">
		{#if data.coachingMode === 'human'}
			<a class={primary} href="{base}/coach"
				><MessagesSquare size={18} aria-hidden="true" />Check-ins and messages with Cash</a
			>
		{/if}
		<a class={data.coachingMode === 'human' ? secondary : primary} href="{base}/log"
			><Dumbbell size={18} aria-hidden="true" />Log</a
		>
		<a class={secondary} href="{base}/progress"
			><TrendingUp size={18} aria-hidden="true" />Progress</a
		>
	</nav>

	{#if showWeek && week && snapshot}
		<WeekPlan {week} targets={snapshot.targets} />
	{/if}

	{#if snapshot && hasNutritionTarget(snapshot.targets)}
		<NutritionCard targets={snapshot.targets} />
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
				<a class={primary} href="{base}/assessment"
					><ClipboardList size={18} aria-hidden="true" />Take the coaching assessment</a
				>
			{/if}
		</section>
	{:else}
		{#if data.program.source === 'ai'}
			<section class={card} aria-labelledby="ai-disclosure">
				<h2 id="ai-disclosure" class="flex items-center gap-1">
					AI Coaching<Tooltip
						label="About AI Coaching"
						text="AI Coaching uses general, Cash-approved templates and the answers you gave. It is not the same as individual coaching from Cash. Disclosure version {aiDisclosureVersion}."
					/>
				</h2>
				{#if data.program.explanation}<p>{data.program.explanation}</p>{/if}
			</section>
		{/if}

		{#if data.program.workout}
			<section class={card}>
				<h2>{data.program.workout.name}</h2>
				{#if data.program.workout.description}<p>{data.program.workout.description}</p>{/if}

				{#if phases.length > 0}
					<div class="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Program phases">
						{#each phases as phase (phase.id)}
							<button
								type="button"
								role="tab"
								aria-selected={selected?.id === phase.id}
								class={selected?.id === phase.id ? tabSelected : tabIdle}
								onclick={() => (chosenPhaseId = phase.id)}
							>
								{phase.name}
							</button>
						{/each}
					</div>
					{#if isCurrent}<p class={help}>This is your current phase.</p>{/if}
				{/if}

				{#if selected}
					<div class="mt-4">
						{#if selected.instructions}<p>{selected.instructions}</p>{/if}
						{#if selected.exercises.length === 0}
							<p class={help}>No exercises in this phase yet.</p>
						{:else}
							<ol class="mt-3 grid gap-3">
								{#each selected.exercises as exercise (exercise.id)}
									{@const varied = exercise.set_plan.length > 0}
									<li class="rounded-lg border border-line p-4">
										<div class="flex flex-wrap items-center justify-between gap-2">
											<strong>{exercise.name}</strong>
											{#if exercise.demo}<ExerciseDemo
													demo={exercise.demo}
													name={exercise.name}
												/>{/if}
										</div>
										<div class="{help} flex flex-wrap items-center gap-x-4 gap-y-1">
											<FactList facts={toFacts(prescriptionFacts(exercise))} />
											{#if exercise.rir || exercise.set_plan.some((set) => set.rir)}<Tooltip
													label="What is RIR?"
													text={rirHelp}
												/>{/if}
										</div>
										{#if varied}
											<ol class="m-0 mb-2 grid list-none gap-1 p-0 text-[0.9rem]">
												{#each exercise.set_plan as set, index (index)}
													<li class="flex flex-wrap items-center gap-x-4 gap-y-1">
														<span class="font-semibold">Set {index + 1}</span>
														{#if setFacts(set).length > 0}
															<FactList facts={setFacts(set)} />
														{:else}
															<span class="text-muted">As you feel</span>
														{/if}
													</li>
												{/each}
											</ol>
										{/if}
										{#if exercise.notes}<p>{exercise.notes}</p>{/if}
									</li>
								{/each}
							</ol>
						{/if}
					</div>
				{/if}
			</section>
		{/if}

		{#if data.program.nutrition}
			<section class={card}>
				<h2 class="flex items-center gap-1">
					{data.program.nutrition.name}<Tooltip
						label="About this nutrition guidance"
						text="Nutrition guidance supports general fitness and wellness. It is not medical advice."
					/>
				</h2>
				{#if data.program.nutrition.description}<p>{data.program.nutrition.description}</p>{/if}
				{#each data.program.nutrition.phases as phase (phase.id)}
					<div class="mt-4">
						<p class="font-semibold">{phase.name}</p>
						{#if phase.instructions}<p>{phase.instructions}</p>{/if}
					</div>
				{/each}
			</section>
		{/if}
	{/if}
</main>

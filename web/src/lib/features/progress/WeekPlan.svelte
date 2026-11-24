<script lang="ts">
	// This week at a glance: what the coach asked for, and what the client has done so far. Used on the
	// client's home page and at the top of the progress dashboard (for the client and for the coach).
	// Steps, cardio and workouts share one row layout: a title, what was asked, then what was done.
	import Dumbbell from '@lucide/svelte/icons/dumbbell';
	import Flame from '@lucide/svelte/icons/flame';
	import Footprints from '@lucide/svelte/icons/footprints';
	import HeartPulse from '@lucide/svelte/icons/heart-pulse';
	import Plus from '@lucide/svelte/icons/plus';
	import type { Component, Snippet } from 'svelte';
	import type { Consistency, WeekStatus } from '$lib/coaching/dashboard';
	import { cardioRequirement, type ClientTargets } from '$lib/coaching/targets';
	import { card, primary } from '$lib/features/cms/styles';
	import { formatNumber } from './chart';
	import Meter from './Meter.svelte';

	let {
		week,
		targets,
		streaks = null,
		audience = 'client'
	}: {
		week: WeekStatus;
		targets: ClientTargets;
		streaks?: Consistency | null;
		audience?: 'client' | 'coach';
	} = $props();

	const stepTarget = $derived(targets.daily_steps_target);
	const cardioRequired = $derived(targets.cardio_sessions_per_week);
	const requirement = $derived(cardioRequirement(targets));
	const hasTargets = $derived(stepTarget !== null || requirement !== '' || !!targets.cardio_notes);

	const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

	const cardioHints = $derived(
		[
			`${week.cardio.minutes} min logged`,
			targets.cardio_minutes !== null && week.cardio.sessions > week.cardio.counted
				? `${plural(week.cardio.sessions - week.cardio.counted, 'session')} under ${targets.cardio_minutes} min did not count`
				: '',
			targets.cardio_hr_min !== null && week.cardio.sessions > 0
				? `${week.cardio.inZone} of ${week.cardio.sessions} in the ${targets.cardio_hr_min}–${targets.cardio_hr_max} BPM zone`
				: ''
		].filter(Boolean)
	);

	const showSteps = $derived(stepTarget !== null || week.steps.average !== null);
	const showCardio = $derived(
		cardioRequired !== null || !!requirement || !!targets.cardio_notes || week.cardio.sessions > 0
	);

	const pill =
		'inline-flex items-center gap-1.5 rounded-full border border-current px-3 py-1 text-[0.85rem] font-semibold text-cyan-deep';
</script>

{#snippet row(
	Icon: Component<{ size?: number; class?: string }>,
	title: string,
	ask: Snippet | null,
	body: Snippet
)}
	<div class="grid gap-3 py-5 first:pt-0 last:pb-0">
		<div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-0.5">
			<h3 class="m-0 flex items-center gap-2 text-[1rem] font-bold">
				<Icon size={20} class="shrink-0 text-cyan-deep" />{title}
			</h3>
			{#if ask}<span class="text-[0.9rem]">{@render ask()}</span>{/if}
		</div>
		{@render body()}
	</div>
{/snippet}

<section class={card} aria-labelledby="this-week">
	<div class="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
		<h2 id="this-week" class="m-0 text-[1.5rem] font-bold">This week</h2>
		<span class="text-[0.85rem] text-muted">Day <strong>{week.daysElapsed}</strong> of 7</span>
	</div>

	{#if !hasTargets}
		<p class="m-0 mb-4 text-muted">
			{audience === 'client'
				? 'Your coach has not set step or cardio targets yet. What you log still shows up here.'
				: 'No step or cardio targets set. Add them under Targets.'}
		</p>
	{/if}

	<div class="divide-y divide-line">
		{#if showSteps}
			{#snippet stepsAsk()}Target <strong>{formatNumber(stepTarget ?? 0)}</strong> a day{/snippet}
			{#snippet stepsBody()}
				{#if stepTarget !== null}
					<Meter
						label="Days on target"
						value={week.steps.daysOnTarget}
						max={7}
						valueText="{week.steps.daysOnTarget} of 7"
						hints={[
							week.steps.todaySteps !== null
								? `Today: ${formatNumber(week.steps.todaySteps)} of ${formatNumber(stepTarget)} steps`
								: 'Today: not logged yet'
						]}
					/>
				{:else if week.steps.average !== null}
					<p class="m-0">
						<strong>{formatNumber(week.steps.average)}</strong> a day on average over
						<strong>{plural(week.steps.daysLogged, 'day')}</strong>
					</p>
				{/if}
			{/snippet}
			{@render row(Footprints, 'Steps', stepTarget !== null ? stepsAsk : null, stepsBody)}
		{/if}

		{#if showCardio}
			{#snippet cardioAsk()}<strong>{requirement}</strong>{/snippet}
			{#snippet cardioBody()}
				{#if cardioRequired !== null}
					<Meter
						label="Sessions counted"
						value={week.cardio.counted}
						max={cardioRequired}
						valueText="{week.cardio.counted} of {cardioRequired}"
						hints={cardioHints}
					/>
				{:else if week.cardio.sessions > 0}
					<p class="m-0">
						<strong>{plural(week.cardio.sessions, 'session')}</strong>, {week.cardio.minutes} min so far
					</p>
				{/if}
				{#if targets.cardio_notes}
					<p class="m-0 rounded-lg border border-line p-3 text-[0.95rem]">
						<strong>From your coach:</strong>
						{targets.cardio_notes}
					</p>
				{/if}
			{/snippet}
			{@render row(HeartPulse, 'Cardio', requirement ? cardioAsk : null, cardioBody)}
		{/if}

		{#snippet workoutsBody()}
			<p class="m-0">
				{#if week.workouts === 0}None completed yet{:else}<strong>{week.workouts}</strong> completed{/if}
			</p>
		{/snippet}
		{@render row(Dumbbell, 'Workouts', null, workoutsBody)}
	</div>

	{#if streaks && (streaks.stepStreak > 0 || streaks.cardioWeekStreak > 0)}
		<ul class="m-0 mt-5 flex list-none flex-wrap gap-2 p-0">
			{#if streaks.stepStreak > 0}
				<li class={pill}>
					<Flame size={15} aria-hidden="true" /><span
						><strong>{streaks.stepStreak}</strong>-day step streak</span
					>
				</li>
			{/if}
			{#if streaks.cardioWeekStreak > 0}
				<li class={pill}>
					<Flame size={15} aria-hidden="true" /><span
						><strong>{streaks.cardioWeekStreak}</strong>-week cardio streak</span
					>
				</li>
			{/if}
		</ul>
	{/if}

	{#if audience === 'client'}
		<p class="mt-5 mb-0">
			<a class={primary} href="/app/log"
				><Plus size={18} aria-hidden="true" />Log steps, cardio or training</a
			>
		</p>
	{/if}
</section>

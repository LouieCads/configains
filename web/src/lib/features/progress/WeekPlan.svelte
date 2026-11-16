<script lang="ts">
	// This week at a glance: what the coach asked for, and what the client has done so far. Used on the
	// client's home page and at the top of the progress dashboard (for the client and for the coach).
	import Flame from '@lucide/svelte/icons/flame';
	import Footprints from '@lucide/svelte/icons/footprints';
	import HeartPulse from '@lucide/svelte/icons/heart-pulse';
	import Plus from '@lucide/svelte/icons/plus';
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

	const cardioHint = $derived(
		[
			`${week.cardio.minutes} min logged`,
			targets.cardio_minutes !== null && week.cardio.sessions > week.cardio.counted
				? `${plural(week.cardio.sessions - week.cardio.counted, 'session')} under ${targets.cardio_minutes} min did not count`
				: '',
			targets.cardio_hr_min !== null && week.cardio.sessions > 0
				? `${week.cardio.inZone} of ${week.cardio.sessions} in the ${targets.cardio_hr_min}–${targets.cardio_hr_max} BPM zone`
				: ''
		]
			.filter(Boolean)
			.join(' · ')
	);
	const pill =
		'inline-flex items-center gap-1.5 rounded-full border border-current px-3 py-1 text-[0.85rem] font-semibold text-cyan-deep';
</script>

<section class={card} aria-labelledby="this-week">
	<div class="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
		<h2 id="this-week" class="m-0 text-[1.5rem] font-bold">This week</h2>
		<span class="text-[0.85rem] text-muted">Monday to Sunday, day {week.daysElapsed} of 7</span>
	</div>

	{#if !hasTargets}
		<p class="m-0 text-muted">
			{audience === 'client'
				? 'Your coach has not set step or cardio targets yet. What you log still shows up here.'
				: 'No step or cardio targets set. Add them under Targets.'}
		</p>
	{/if}

	<div class="grid gap-6">
		{#if stepTarget !== null}
			<div class="grid gap-3">
				<p class="m-0 flex items-center gap-2 font-semibold">
					<Footprints size={20} aria-hidden="true" class="shrink-0 text-cyan-deep" />
					Walk at least {formatNumber(stepTarget)} steps a day
				</p>
				<Meter
					label="Days on target"
					value={week.steps.daysOnTarget}
					max={7}
					valueText="{week.steps.daysOnTarget} of 7 days"
					hint={week.steps.todaySteps !== null
						? `Today: ${formatNumber(week.steps.todaySteps)} of ${formatNumber(stepTarget)} steps`
						: 'Today: not logged yet'}
				/>
			</div>
		{:else if week.steps.average !== null}
			<p class="m-0">
				<span class="font-semibold">Steps:</span>
				{formatNumber(week.steps.average)} a day on average over {plural(
					week.steps.daysLogged,
					'day'
				)}
			</p>
		{/if}

		{#if cardioRequired !== null || requirement || targets.cardio_notes}
			<div class="grid gap-3">
				{#if requirement}
					<p class="m-0 flex items-center gap-2 font-semibold">
						<HeartPulse size={20} aria-hidden="true" class="shrink-0 text-cyan-deep" />
						Cardio: {requirement}
					</p>
				{/if}
				{#if cardioRequired !== null}
					<Meter
						label="Sessions this week"
						value={week.cardio.counted}
						max={cardioRequired}
						valueText="{week.cardio.counted} of {cardioRequired}"
						hint={cardioHint}
					/>
				{:else if week.cardio.sessions > 0}
					<p class="m-0">
						{plural(week.cardio.sessions, 'session')}, {week.cardio.minutes} min so far
					</p>
				{/if}
				{#if targets.cardio_notes}
					<p class="m-0 rounded-lg border border-line p-3 text-[0.95rem]">
						<span class="font-semibold">From your coach:</span>
						{targets.cardio_notes}
					</p>
				{/if}
			</div>
		{:else if week.cardio.sessions > 0}
			<p class="m-0">
				<span class="font-semibold">Cardio:</span>
				{plural(week.cardio.sessions, 'session')}, {week.cardio.minutes} min
			</p>
		{/if}

		<p class="m-0">
			<span class="font-semibold">Workouts:</span>
			{week.workouts === 0 ? 'none completed yet' : `${week.workouts} completed`}
		</p>
	</div>

	{#if streaks && (streaks.stepStreak > 0 || streaks.cardioWeekStreak > 0)}
		<ul class="m-0 mt-5 flex list-none flex-wrap gap-2 p-0">
			{#if streaks.stepStreak > 0}
				<li class={pill}>
					<Flame size={15} aria-hidden="true" />{streaks.stepStreak}-day step streak
				</li>
			{/if}
			{#if streaks.cardioWeekStreak > 0}
				<li class={pill}>
					<Flame size={15} aria-hidden="true" />{streaks.cardioWeekStreak}-week cardio streak
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

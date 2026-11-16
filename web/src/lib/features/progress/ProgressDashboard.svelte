<script lang="ts">
	// The client's progress, in the order that tells the story: what was asked and what they did this
	// week, how it adds up over four weeks (effort, consistency, results), then the charts behind it.
	// Shown to the client on /app/progress and to the coach on the client's own page.
	import { onMount } from 'svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import {
		consistency,
		fourWeekReview,
		metricTrend,
		stepDays,
		strengthProgress,
		weekStatus,
		weeklyHistory,
		type DashboardRows
	} from '$lib/coaching/dashboard';
	import { cardioRequirement, type ClientTargets } from '$lib/coaching/targets';
	import { card, help } from '$lib/features/cms/styles';
	import { formatFixed, formatNumber, longDate, shortDate, signed } from './chart';
	import ChartCard from './ChartCard.svelte';
	import ColumnChart from './ColumnChart.svelte';
	import LineChart from './LineChart.svelte';
	import StatTile from './StatTile.svelte';
	import WeekPlan from './WeekPlan.svelte';

	let {
		data,
		today: initialToday,
		audience = 'client'
	}: {
		data: DashboardRows & { targets: ClientTargets };
		today: string;
		audience?: 'client' | 'coach';
	} = $props();

	// The server's date is UTC. In the browser the viewer's own date takes over, so "today" is right
	// for someone whose evening is already tomorrow in UTC.
	// svelte-ignore state_referenced_locally
	let today = $state(initialToday);
	onMount(() => {
		today = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000)
			.toISOString()
			.slice(0, 10);
	});

	const targets = $derived(data.targets);
	const rows = $derived<DashboardRows>({
		logs: data.logs,
		metrics: data.metrics,
		steps: data.steps,
		cardio: data.cardio
	});

	const week = $derived(weekStatus(rows, targets, today));
	const history = $derived(weeklyHistory(rows, targets, today, 8));
	const streaks = $derived(consistency(rows, targets, today));
	const review = $derived(fourWeekReview(rows, targets, today));
	const weight = $derived(metricTrend(data.metrics, 'body_weight_kg', today));
	const waist = $derived(metricTrend(data.metrics, 'waist_cm', today));
	const strength = $derived(strengthProgress(data.logs));
	const days = $derived(stepDays(data.steps, targets.daily_steps_target, today, 14));

	let chosenExercise = $state<string | null>(null);
	const exercise = $derived(strength.find((item) => item.key === chosenExercise) ?? strength[0]);

	const stepTarget = $derived(targets.daily_steps_target);
	const cardioRequired = $derived(targets.cardio_sessions_per_week);
	const requirement = $derived(cardioRequirement(targets));

	const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;
	const direction = (change: number) => (change > 0 ? 'up' : change < 0 ? 'down' : 'flat');
	const monthName = (key: string) =>
		new Date(`${key}-01T00:00:00Z`).toLocaleDateString('en-GB', { month: 'long', timeZone: 'UTC' });
	const change = (value: number | null | undefined, unit: string) =>
		value === null || value === undefined
			? null
			: { text: `${signed(value)} ${unit}`, direction: direction(value) as 'up' | 'down' | 'flat' };

	const empty = $derived(
		audience === 'client'
			? { weight: 'Log your body weight to see your trend.', link: true }
			: { weight: 'No body weight logged yet.', link: false }
	);

	const sectionTitle = 'm-0 text-[1.5rem] font-bold';
	const groupTitle = 'm-0 text-[0.75rem] font-bold tracking-[1px] text-muted uppercase';
</script>

<div class="grid gap-6">
	<!-- 1. This week: what was asked, and what was done. -->
	<WeekPlan {week} {targets} {streaks} {audience} />

	<!-- 2. The four-week picture: effort, consistency, results. -->
	<section class={card} aria-labelledby="four-weeks">
		<h2 id="four-weeks" class={sectionTitle}>The last four weeks</h2>
		<p class="{help} mt-1! mb-5!">What you put in, how steady you were, and what moved.</p>
		<div class="grid gap-6 min-[720px]:grid-cols-3">
			<div class="grid content-start gap-2">
				<h3 class={groupTitle}>Effort</h3>
				<p class="m-0">{plural(review.effort.workouts, 'workout')} completed</p>
				<p class="m-0">{plural(review.effort.cardioSessions, 'cardio session')}</p>
				{#if review.effort.averageSteps !== null}
					<p class="m-0">{formatNumber(review.effort.averageSteps)} steps a day on average</p>
				{/if}
			</div>
			<div class="grid content-start gap-2">
				<h3 class={groupTitle}>Consistency</h3>
				{#if review.consistency.stepDaysOnTarget !== null}
					<p class="m-0">
						Step target reached on {review.consistency.stepDaysOnTarget} of {review.consistency
							.stepDays}
						days
					</p>
				{/if}
				{#if review.consistency.cardioCounted !== null && review.consistency.cardioRequired !== null}
					<p class="m-0">
						{review.consistency.cardioCounted} of {review.consistency.cardioRequired} cardio sessions
					</p>
				{/if}
				{#if review.consistency.stepDaysOnTarget === null && review.consistency.cardioCounted === null}
					<p class="m-0 text-muted">Targets will show here once your coach sets them.</p>
				{/if}
			</div>
			<div class="grid content-start gap-2">
				<h3 class={groupTitle}>Results</h3>
				{#if review.results.weightChange !== null}
					<p class="m-0">
						Weight {signed(review.results.weightChange)} kg over {plural(
							review.results.weightWeeks,
							'week'
						)}
					</p>
				{:else}
					<p class="m-0 text-muted">Weigh in once a week to see how it changes.</p>
				{/if}
				{#if review.results.topStrength}
					<p class="m-0">
						{review.results.topStrength.name} strength up {formatNumber(
							review.results.topStrength.percent,
							1
						)}%
					</p>
				{/if}
			</div>
		</div>
	</section>

	<!-- 3. Results: weight and strength. -->
	<h2 class="{sectionTitle} mt-4">Results</h2>

	<ChartCard
		title="Weight trend"
		description="Each point is a day you weighed in. Weekly and monthly figures are averages."
		columns={['Date', 'Weight (kg)']}
		rows={[...weight.points]
			.reverse()
			.map((point) => [longDate(point.date), formatNumber(point.value, 1)])}
	>
		{#if weight.points.length === 0}
			<p class="m-0 text-muted">{empty.weight}</p>
			{#if empty.link}<p class="mt-3 mb-0">
					<a class="text-cyan-ink underline" href="/app/log">Log a measurement</a>
				</p>{/if}
		{:else}
			<div class="mb-5 grid grid-cols-1 gap-3 min-[560px]:grid-cols-3">
				{#if weight.week}
					<StatTile
						label={weight.week.current ? 'This week' : `Week of ${shortDate(weight.week.key)}`}
						value={formatFixed(weight.week.average)}
						unit="kg"
						change={change(weight.week.change, 'kg')}
						changeLabel="vs the week before"
					/>
				{/if}
				{#if weight.month}
					<StatTile
						label={weight.month.current ? 'This month' : monthName(weight.month.key)}
						value={formatFixed(weight.month.average)}
						unit="kg"
						change={change(weight.month.change, 'kg')}
						changeLabel="vs the month before"
					/>
				{/if}
				{#if weight.overall}
					<StatTile
						label="Since your first weigh-in"
						value={signed(weight.overall.change)}
						unit="kg"
						change={null}
					/>
				{/if}
			</div>
			<LineChart
				points={weight.points}
				unit="kg"
				label="Body weight over time, in kilograms"
				decimals={1}
			/>
		{/if}
		{#if waist.week}
			<div class="mt-5 grid grid-cols-1 gap-3 min-[560px]:grid-cols-3">
				<StatTile
					label="Waist, {waist.week.current ? 'this week' : `week of ${shortDate(waist.week.key)}`}"
					value={formatFixed(waist.week.average)}
					unit="cm"
					change={change(waist.week.change, 'cm')}
					changeLabel="vs the week before"
				/>
			</div>
		{/if}
	</ChartCard>

	<ChartCard
		title="Strength"
		description="Based on the weights and reps you log in your workouts."
		columns={['Date', 'Load (kg)', 'Reps', 'Estimated strength (kg)']}
		rows={exercise
			? [...exercise.sessions]
					.reverse()
					.map((session) => [
						longDate(session.date),
						formatNumber(session.load, 1),
						session.reps ?? '–',
						formatNumber(session.strength, 1)
					])
			: []}
	>
		{#if !exercise}
			<p class="m-0 text-muted">
				{audience === 'client'
					? 'Log the weight and reps for an exercise in a workout to see your strength grow.'
					: 'No exercise has a logged weight yet.'}
			</p>
		{:else}
			{#if strength.length > 1}
				<label class="mb-4 grid max-w-sm gap-1 font-semibold"
					>Exercise
					<select
						value={exercise.key}
						onchange={(event) => (chosenExercise = event.currentTarget.value)}
					>
						{#each strength as item (item.key)}
							<option value={item.key}>{item.name}</option>
						{/each}
					</select>
				</label>
			{/if}
			<div class="mb-5 grid grid-cols-1 gap-3 min-[560px]:grid-cols-3">
				<StatTile
					label="Estimated strength"
					value={formatFixed(exercise.sessions.at(-1)?.strength ?? 0)}
					unit="kg"
					change={exercise.change
						? {
								text: `${signed(exercise.change.kg)} kg (${signed(exercise.change.percent)}%)`,
								direction: direction(exercise.change.kg)
							}
						: null}
					changeLabel="since your first log"
					tone="good"
				/>
			</div>
			<p class="{help} mt-0! mb-3! flex items-start gap-1">
				<!-- The note comes first: its bubble opens to the right and would run off a narrow screen from the line end. -->
				<Tooltip
					label="How strength is estimated"
					text="Estimated one-rep max (Epley formula): weight × (1 + reps ÷ 30), counting up to 12 reps. It is a guide to your trend, not a max-out test."
				/>
				<span class="pt-0.5"
					>Estimated from the weight and reps you log, so the same weight for more reps counts as
					stronger.</span
				>
			</p>
			{#if exercise.sessions.length > 1}
				<LineChart
					points={exercise.sessions.map((session) => ({
						date: session.date,
						value: session.strength
					}))}
					unit="kg"
					label="Estimated strength for {exercise.name} over time, in kilograms"
					decimals={1}
				/>
			{:else}
				<p class="m-0 text-muted">Log {exercise.name} again to see it as a trend.</p>
			{/if}
		{/if}
	</ChartCard>

	<!-- 4. Effort and consistency: steps, cardio, workouts. -->
	<h2 class="{sectionTitle} mt-4">Effort and consistency</h2>

	<ChartCard
		title="Steps"
		description={stepTarget !== null
			? `The last 14 days against your target of ${formatNumber(stepTarget)} steps a day.`
			: 'The last 14 days.'}
		columns={['Date', 'Steps', 'Target']}
		rows={[...days]
			.reverse()
			.map((day) => [
				longDate(day.date),
				day.steps === null ? 'Not logged' : formatNumber(day.steps),
				day.met === null ? '–' : day.met ? 'Reached' : 'Below'
			])}
	>
		{#if data.steps.length === 0}
			<p class="m-0 text-muted">
				{audience === 'client' ? 'Log your steps to see them here.' : 'No steps logged yet.'}
			</p>
		{:else}
			<ColumnChart
				bars={days.map((day) => ({
					tick: String(Number(day.date.slice(8))),
					value: day.steps,
					met: day.met,
					detail:
						day.steps === null
							? `${longDate(day.date)}: not logged`
							: `${longDate(day.date)}: ${formatNumber(day.steps)} steps`
				}))}
				target={stepTarget}
				targetLabel="Target"
				label="Steps for each of the last 14 days"
			/>
		{/if}
	</ChartCard>

	<ChartCard
		title="Cardio"
		description={requirement
			? `Sessions each week against your requirement: ${requirement}.`
			: 'Sessions each week.'}
		columns={['Week of', cardioRequired !== null ? 'Counted sessions' : 'Sessions', 'Minutes']}
		rows={[...history]
			.reverse()
			.map((item) => [
				shortDate(item.week),
				cardioRequired !== null ? item.cardioCounted : item.cardioSessions,
				item.cardioMinutes
			])}
	>
		{#if data.cardio.length === 0}
			<p class="m-0 text-muted">
				{audience === 'client' ? 'Log a cardio session to see it here.' : 'No cardio logged yet.'}
			</p>
		{:else}
			<ColumnChart
				bars={history.map((item, index) => {
					const value = cardioRequired !== null ? item.cardioCounted : item.cardioSessions;
					return {
						tick: shortDate(item.week),
						value,
						met: cardioRequired !== null ? value >= cardioRequired : null,
						detail: `Week of ${shortDate(item.week)}: ${plural(value, 'session')}, ${item.cardioMinutes} min${index === history.length - 1 ? ' so far' : ''}`
					};
				})}
				target={cardioRequired}
				targetLabel="Required"
				label="Cardio sessions for each of the last 8 weeks"
			/>
		{/if}
	</ChartCard>

	<ChartCard
		title="Workouts"
		description="Completed strength sessions each week."
		columns={['Week of', 'Workouts']}
		rows={[...history].reverse().map((item) => [shortDate(item.week), item.workouts])}
	>
		{#if data.logs.length === 0}
			<p class="m-0 text-muted">
				{audience === 'client' ? 'Log a workout to see it here.' : 'No workouts logged yet.'}
			</p>
		{:else}
			<ColumnChart
				bars={history.map((item, index) => ({
					tick: shortDate(item.week),
					value: item.workouts,
					met: null,
					detail: `Week of ${shortDate(item.week)}: ${plural(item.workouts, 'workout')}${index === history.length - 1 ? ' so far' : ''}`
				}))}
				label="Workouts completed for each of the last 8 weeks"
			/>
		{/if}
	</ChartCard>
</div>

<script lang="ts">
	// The client's progress, in the order that tells the story: what was asked and what they did this
	// week, how it adds up over four weeks, then the charts behind it. A chart with no data is left
	// out, and one note at the end says what is still missing, so no card is ever an empty box.
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
	import StatGrid, { type Tile } from './StatGrid.svelte';
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

	// What each chart needs before it is worth showing.
	const hasWeight = $derived(weight.points.length > 0 || waist.week !== null);
	const hasStrength = $derived(exercise !== undefined);
	const hasSteps = $derived(data.steps.length > 0);
	const hasCardio = $derived(data.cardio.length > 0);
	const hasWorkouts = $derived(data.logs.length > 0);
	const missing = $derived(
		[
			!hasWeight && 'body weight',
			!hasStrength && 'strength',
			!hasSteps && 'steps',
			!hasCardio && 'cardio',
			!hasWorkouts && 'workouts'
		].filter((name): name is string => name !== false)
	);

	// The last four weeks, one tile each. A figure with nothing behind it is left out.
	const present = (tiles: (Tile | false | null)[]) =>
		tiles.filter((tile): tile is Tile => tile !== false && tile !== null);

	const fourWeeks = $derived<Tile[]>(
		present([
			{
				label: 'Workouts',
				value: String(review.effort.workouts),
				unit: 'completed'
			},
			{
				label: 'Cardio',
				value:
					review.consistency.cardioCounted !== null
						? String(review.consistency.cardioCounted)
						: String(review.effort.cardioSessions),
				unit:
					review.consistency.cardioRequired !== null
						? `of ${formatNumber(review.consistency.cardioRequired)} required`
						: review.effort.cardioSessions === 1
							? 'session'
							: 'sessions'
			},
			review.effort.averageSteps !== null && {
				label: 'Steps',
				value: formatNumber(review.effort.averageSteps),
				unit: 'a day on average'
			},
			review.consistency.stepDaysOnTarget !== null && {
				label: 'Step target',
				value: String(review.consistency.stepDaysOnTarget),
				unit: `of ${review.consistency.stepDays} days reached`
			},
			review.results.weightChange !== null && {
				label: 'Weight',
				value: signed(review.results.weightChange),
				unit: `kg over ${plural(review.results.weightWeeks, 'week')}`
			},
			review.results.topStrength && {
				label: 'Top strength gain',
				value: signed(review.results.topStrength.percent),
				unit: `% in ${review.results.topStrength.name}`,
				tone: 'good'
			}
		])
	);

	// Weight and waist figures share one grid so the card reads as a single set.
	const bodyTiles = $derived<Tile[]>(
		present([
			weight.week && {
				label: weight.week.current ? 'This week' : `Week of ${shortDate(weight.week.key)}`,
				value: formatFixed(weight.week.average),
				unit: 'kg',
				change: change(weight.week.change, 'kg'),
				changeLabel: 'vs the week before'
			},
			weight.month && {
				label: weight.month.current ? 'This month' : monthName(weight.month.key),
				value: formatFixed(weight.month.average),
				unit: 'kg',
				change: change(weight.month.change, 'kg'),
				changeLabel: 'vs the month before'
			},
			weight.overall && {
				label: 'Since your first weigh-in',
				value: signed(weight.overall.change),
				unit: 'kg'
			},
			waist.week && {
				label: `Waist, ${waist.week.current ? 'this week' : `week of ${shortDate(waist.week.key)}`}`,
				value: formatFixed(waist.week.average),
				unit: 'cm',
				change: change(waist.week.change, 'cm'),
				changeLabel: 'vs the week before'
			}
		])
	);

	const sectionTitle = 'm-0 text-[1.5rem] font-bold';
</script>

<div class="grid gap-6">
	<!-- 1. This week: what was asked, and what was done. -->
	<WeekPlan {week} {targets} {streaks} {audience} />

	<!-- 2. The four-week picture. -->
	<section class={card} aria-labelledby="four-weeks">
		<h2 id="four-weeks" class="{sectionTitle} mb-4">The last four weeks</h2>
		<StatGrid tiles={fourWeeks} />
	</section>

	<!-- 3. Results: weight and strength. -->
	{#if hasWeight || hasStrength}
		<h2 class="{sectionTitle} mt-4">Results</h2>
	{/if}

	{#if hasWeight}
		<ChartCard
			title="Weight trend"
			description="Each point is a day you weighed in. Weekly and monthly figures are averages."
			columns={['Date', 'Weight (kg)']}
			rows={[...weight.points]
				.reverse()
				.map((point) => [longDate(point.date), formatNumber(point.value, 1)])}
		>
			<StatGrid tiles={bodyTiles} />
			{#if weight.points.length > 0}
				<div class={bodyTiles.length > 0 ? 'mt-5' : ''}>
					<LineChart
						points={weight.points}
						unit="kg"
						label="Body weight over time, in kilograms"
						decimals={1}
					/>
				</div>
			{/if}
		</ChartCard>
	{/if}

	{#if exercise}
		<ChartCard
			title="Strength"
			description="Based on the weights and reps you log in your workouts."
			columns={['Date', 'Load (kg)', 'Reps', 'Estimated strength (kg)']}
			rows={[...exercise.sessions]
				.reverse()
				.map((session) => [
					longDate(session.date),
					formatNumber(session.load, 1),
					session.reps ?? '–',
					formatNumber(session.strength, 1)
				])}
		>
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
			<StatGrid
				tiles={[
					{
						label: 'Estimated strength',
						value: formatFixed(exercise.sessions.at(-1)?.strength ?? 0),
						unit: 'kg',
						change: exercise.change
							? {
									text: `${signed(exercise.change.kg)} kg (${signed(exercise.change.percent)}%)`,
									direction: direction(exercise.change.kg)
								}
							: null,
						changeLabel: 'since your first log',
						tone: 'good'
					}
				]}
			/>
			<p class="{help} mt-4! mb-3! flex items-start gap-1">
				<!-- The note comes first: its bubble opens to the right and would run off a narrow screen from the line end. -->
				<Tooltip
					label="How strength is estimated"
					text="Estimated one-rep max (Epley formula): weight × (1 + reps ÷ 30), counting up to 12 reps. It is a guide to your trend, not a max-out test."
				/>
				<span class="pt-0.5">Same weight for more reps counts as <strong>stronger</strong>.</span>
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
		</ChartCard>
	{/if}

	<!-- 4. Effort and consistency: steps, cardio, workouts. -->
	{#if hasSteps || hasCardio || hasWorkouts}
		<h2 class="{sectionTitle} mt-4">Effort and consistency</h2>
	{/if}

	{#if hasSteps}
		<ChartCard
			title="Steps"
			description="The last 14 days against the daily target."
			columns={['Date', 'Steps', 'Target']}
			rows={[...days]
				.reverse()
				.map((day) => [
					longDate(day.date),
					day.steps === null ? 'Not logged' : formatNumber(day.steps),
					day.met === null ? '–' : day.met ? 'Reached' : 'Below'
				])}
		>
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
		</ChartCard>
	{/if}

	{#if hasCardio}
		<ChartCard
			title="Cardio"
			description={requirement
				? 'Sessions each week against the weekly requirement.'
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
		</ChartCard>
	{/if}

	{#if hasWorkouts}
		<ChartCard
			title="Workouts"
			description="Completed strength sessions each week."
			columns={['Week of', 'Workouts']}
			rows={[...history].reverse().map((item) => [shortDate(item.week), item.workouts])}
		>
			<ColumnChart
				bars={history.map((item, index) => ({
					tick: shortDate(item.week),
					value: item.workouts,
					met: null,
					detail: `Week of ${shortDate(item.week)}: ${plural(item.workouts, 'workout')}${index === history.length - 1 ? ' so far' : ''}`
				}))}
				label="Workouts completed for each of the last 8 weeks"
			/>
		</ChartCard>
	{/if}

	<!-- 5. One note for everything that has no data yet. -->
	{#if missing.length > 0}
		<section class={card} aria-labelledby="not-yet">
			<h2 id="not-yet" class="m-0 mb-2 text-[1.25rem] font-bold">Not charted yet</h2>
			<p class="m-0 text-muted">
				{#each missing as name, index (name)}<strong class="text-ink">{name}</strong>{index <
					missing.length - 2
						? ', '
						: index === missing.length - 2
							? ' and '
							: ''}{/each}
				{audience === 'client' ? 'will chart here once you log them.' : 'have nothing logged yet.'}
			</p>
			{#if audience === 'client'}
				<p class="mt-3 mb-0"><a class="text-cyan-ink underline" href="/app/log">Open the log</a></p>
			{/if}
		</section>
	{/if}
</div>

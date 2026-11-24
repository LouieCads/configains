<script lang="ts">
	import Activity from '@lucide/svelte/icons/activity';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import CircleX from '@lucide/svelte/icons/circle-x';
	import HeartPulse from '@lucide/svelte/icons/heart-pulse';
	import Repeat from '@lucide/svelte/icons/repeat';
	import Timer from '@lucide/svelte/icons/timer';
	import Weight from '@lucide/svelte/icons/weight';
	import FactList from '$lib/components/FactList.svelte';
	import { progressMetrics } from '$lib/coaching/progress';
	import { formatNumber } from '$lib/features/progress/chart';
	import ProgressDashboard from '$lib/features/progress/ProgressDashboard.svelte';
	import { card, clientPage, help } from '$lib/features/cms/styles';
	import type { loadDashboard } from '$lib/server/coaching/progress';
	type Data = Awaited<ReturnType<typeof loadDashboard>> & { today: string };
	let { data, base = '/app' }: { data: Data; base?: string } = $props();

	const metricLabel = (key: string) => progressMetrics.find((metric) => metric.key === key);
	const weekLabel = (key: string) =>
		`Week of ${new Date(`${key}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })}`;
	const monthLabel = (key: string) =>
		new Date(`${key}-01T00:00:00Z`).toLocaleDateString('en-GB', {
			month: 'long',
			year: 'numeric',
			timeZone: 'UTC'
		});
	const dayLabel = (key: string) =>
		new Date(`${key}T00:00:00Z`).toLocaleDateString('en-GB', {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			timeZone: 'UTC'
		});
</script>

<svelte:head
	><title>Your progress | Configains</title><meta
		name="robots"
		content="noindex, nofollow"
	/></svelte:head
>
<main class="{clientPage} mx-auto grid max-w-[760px] gap-6 p-6">
	<p class="m-0"><a href={base}>Back to your plan</a></p>
	<h1 class="m-0">Your progress</h1>

	<ProgressDashboard {data} today={data.today} />

	<details class={card}>
		<summary class="cursor-pointer text-xl font-bold">All entries</summary>

		<h2 class="mt-6 mb-0">Weekly</h2>
		<p class={help}>Completed workouts and average measurements, Monday to Sunday.</p>
		<div class="overflow-x-auto">
			<table class="w-full text-left">
				<thead>
					<tr
						><th>Week</th><th>Workouts</th>
						{#each progressMetrics as metric (metric.key)}<th>{metric.label}</th>{/each}
					</tr>
				</thead>
				<tbody>
					{#each data.weekly as week (week.key)}
						<tr>
							<td>{weekLabel(week.key)}</td>
							<td>{week.workouts}</td>
							{#each progressMetrics as metric (metric.key)}
								<td
									>{week.averages[metric.key] !== undefined
										? `${week.averages[metric.key]} ${metric.unit}`
										: '–'}</td
								>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<h2 class="mt-6">Monthly</h2>
		<div class="overflow-x-auto">
			<table class="w-full text-left">
				<thead>
					<tr
						><th>Month</th><th>Workouts</th>
						{#each progressMetrics as metric (metric.key)}<th>{metric.label}</th>{/each}
					</tr>
				</thead>
				<tbody>
					{#each data.monthly as month (month.key)}
						<tr>
							<td>{monthLabel(month.key)}</td>
							<td>{month.workouts}</td>
							{#each progressMetrics as metric (metric.key)}
								<td
									>{month.averages[metric.key] !== undefined
										? `${month.averages[metric.key]} ${metric.unit}`
										: '–'}</td
								>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<h2 class="mt-6">Recent workouts</h2>
		{#if data.logs.length === 0}
			<p>No workouts logged in the last 6 months.</p>
		{/if}
		<ul class="grid gap-3">
			{#each data.logs.slice(0, 20) as log (log.id)}
				<li class="border-b border-line pb-3">
					<div class="flex flex-wrap items-center gap-x-4 gap-y-1">
						<strong>{dayLabel(log.logged_on)}</strong>
						<FactList
							facts={[
								log.completed
									? { icon: CircleCheck, value: 'Completed' }
									: { icon: CircleX, value: 'Not completed' },
								...(log.duration_minutes
									? [{ icon: Timer, value: String(log.duration_minutes), trail: 'min' }]
									: [])
							]}
						/>
					</div>
					{#if log.entries.length > 0}
						<ul class="mt-2 mb-0 grid list-none gap-1 p-0 text-[0.9rem]">
							{#each log.entries as entry, index (index)}
								<li class="flex flex-wrap items-center gap-x-4 gap-y-1">
									<span class="font-semibold">{entry.name}</span>
									<FactList
										facts={[
											...(entry.sets
												? [
														{
															icon: Repeat,
															value: `${entry.sets}×${entry.reps ?? ''}`
														}
													]
												: []),
											...(entry.load_kg
												? [{ icon: Weight, value: String(entry.load_kg), trail: 'kg' }]
												: [])
										]}
									/>
								</li>
							{/each}
						</ul>
					{/if}
					{#if log.notes}<p>{log.notes}</p>{/if}
				</li>
			{/each}
		</ul>

		<h2 class="mt-6">Recent cardio</h2>
		{#if data.cardio.length === 0}
			<p>No cardio logged in the last 6 months.</p>
		{/if}
		<ul class="grid gap-2">
			{#each data.cardio.slice(0, 20) as session (session.id)}
				<li class="flex flex-wrap items-center gap-x-4 gap-y-1">
					<strong>{dayLabel(session.logged_on)}</strong>
					<FactList
						facts={[
							{ icon: Activity, value: session.activity ?? 'Cardio' },
							{ icon: Timer, value: String(session.duration_minutes), trail: 'min' },
							...(session.avg_heart_rate
								? [
										{
											icon: HeartPulse,
											value: String(session.avg_heart_rate),
											trail: 'BPM average'
										}
									]
								: [])
						]}
					/>
				</li>
			{/each}
		</ul>

		<h2 class="mt-6">Recent steps</h2>
		{#if data.steps.length === 0}
			<p>No steps logged in the last 6 months.</p>
		{/if}
		<ul class="grid gap-2">
			{#each data.steps.slice(0, 20) as entry (entry.id)}
				<li>{dayLabel(entry.logged_on)}: {formatNumber(entry.steps)} steps</li>
			{/each}
		</ul>

		<h2 class="mt-6">Recent measurements</h2>
		{#if data.metrics.length === 0}
			<p>No measurements in the last 6 months.</p>
		{/if}
		<ul class="grid gap-2">
			{#each data.metrics.slice(0, 20) as entry (entry.id)}
				<li>
					{dayLabel(entry.measured_on)}: {metricLabel(entry.metric)?.label ?? entry.metric}: {entry.value}
					{metricLabel(entry.metric)?.unit ?? ''}
				</li>
			{/each}
		</ul>
	</details>
</main>

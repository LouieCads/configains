<script lang="ts">
	import { progressMetrics } from '$lib/coaching/progress';
	import { card, help, primary } from '$lib/features/cms/styles';
	let { data } = $props();

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
<main class="mx-auto grid max-w-[640px] gap-6 p-6">
	<p><a href="/app">Back to your program</a></p>
	<h1>Your progress</h1>
	<a class={primary} href="/app/log">Log training or a measurement</a>

	<section class={card}>
		<h2>Weekly</h2>
		<p class={help}>Completed workouts and average measurements, Monday to Sunday.</p>
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
	</section>

	<section class={card}>
		<h2>Monthly</h2>
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
	</section>

	<section class={card}>
		<h2>Recent workouts</h2>
		{#if data.logs.length === 0}
			<p>No workouts logged in the last 6 months.</p>
		{/if}
		<ul class="grid gap-3">
			{#each data.logs.slice(0, 20) as log (log.id)}
				<li class="border-b border-line pb-3">
					<strong>{dayLabel(log.logged_on)}</strong>
					<span class={help}
						>{log.completed ? 'Completed' : 'Not completed'}{log.duration_minutes
							? ` · ${log.duration_minutes} min`
							: ''}</span
					>
					{#if log.entries.length > 0}
						<p class={help}>
							{log.entries
								.map(
									(entry) =>
										`${entry.name}${entry.sets ? ` ${entry.sets}×${entry.reps ?? ''}` : ''}${entry.load_kg ? ` @ ${entry.load_kg} kg` : ''}`
								)
								.join(' · ')}
						</p>
					{/if}
					{#if log.notes}<p>{log.notes}</p>{/if}
				</li>
			{/each}
		</ul>
	</section>

	<section class={card}>
		<h2>Recent measurements</h2>
		{#if data.metrics.length === 0}
			<p>No measurements in the last 6 months.</p>
		{/if}
		<ul class="grid gap-2">
			{#each data.metrics.slice(0, 20) as entry (entry.id)}
				<li>
					{dayLabel(entry.measured_on)} · {metricLabel(entry.metric)?.label ?? entry.metric}: {entry.value}
					{metricLabel(entry.metric)?.unit ?? ''}
				</li>
			{/each}
		</ul>
	</section>
</main>

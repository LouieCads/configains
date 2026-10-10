<script lang="ts">
	import { card, error, help, primary, secondary, success } from '$lib/features/cms/styles';
	import { progressMetrics } from '$lib/coaching/progress';
	let { data, form } = $props();

	const when = (value: string) =>
		new Date(value).toLocaleDateString('en-GB', { dateStyle: 'medium' });
	const phases = $derived(data.program?.workout?.phases ?? []);
</script>

<svelte:head><title>{data.client.display_name ?? 'Client'} | Configains CMS</title></svelte:head>
<p><a href="/admin/clients">Back to clients</a></p>
<h1>{data.client.display_name ?? 'Unnamed client'}</h1>
<p class={help}>
	{data.client.coaching_mode === 'human' ? 'Human coaching' : 'AI coaching'} · joined {when(
		data.client.created_at
	)}
</p>

{#if form?.message}<p class={error} role="alert">{form.message}</p>{/if}
{#if form?.updated}<p class={success} role="status">Saved.</p>{/if}

<section class={card}>
	<h2>Program</h2>
	{#if !data.program}
		<p>No active program. Assign one from the Clients or Assessments page.</p>
	{:else}
		<p class={help}>
			{data.program.source === 'ai' ? 'Matched by AI Coaching' : 'Assigned by you'}
		</p>
		<h3>{data.program.workout?.name ?? 'No workout'}</h3>

		{#if data.program.customised}
			<p class={help}>This workout is customised for this client.</p>
		{:else}
			<form method="POST" action="?/customise">
				<input type="hidden" name="program_id" value={data.program.id} />
				<p class={help}>
					Customising makes a private copy of this workout for this client. Library templates stay
					unchanged.
				</p>
				<button class={secondary}>Customise for this client</button>
			</form>
		{/if}

		{#if phases.length > 0}
			<form method="POST" action="?/phase" class="mt-4 grid gap-2">
				<input type="hidden" name="program_id" value={data.program.id} />
				<label class="grid gap-1"
					>Current phase
					<select name="phase_id">
						{#each phases as phase (phase.id)}
							<option value={phase.id} selected={phase.id === data.program.currentPhaseId}
								>{phase.name}</option
							>
						{/each}
					</select>
				</label>
				<button class={primary}>Move client to this phase</button>
			</form>
		{/if}
	{/if}
</section>

<section class={card}>
	<h2>Progress</h2>
	<p class={help}>Last 12 weeks, from the client's logs and measurements.</p>
	<p>Completed workouts this week: {data.progress.weekly[0]?.workouts ?? 0}</p>
	{#each progressMetrics as metric (metric.key)}
		{#if data.progress.weekly[0]?.averages[metric.key] !== undefined}
			<p>{metric.label} this week: {data.progress.weekly[0].averages[metric.key]} {metric.unit}</p>
		{/if}
	{/each}
	<h3>Recent workouts</h3>
	{#if data.progress.logs.length === 0}<p>No workouts logged yet.</p>{/if}
	<ul class="grid gap-1">
		{#each data.progress.logs.slice(0, 10) as log (log.id)}
			<li>
				{when(log.logged_on)} · {log.completed ? 'Completed' : 'Not completed'}{log.duration_minutes
					? ` · ${log.duration_minutes} min`
					: ''}
			</li>
		{/each}
	</ul>
</section>

<section class={card}>
	<h2>Check-ins</h2>
	{#if data.checkIns.length === 0}
		<p>No check-ins yet.</p>
	{/if}
	{#each data.checkIns as checkIn (checkIn.id)}
		<article class="my-4 grid gap-2 border-b border-line pb-4">
			<p class={help}>{when(checkIn.submitted_on)}</p>
			<p>{checkIn.body}</p>
			<form method="POST" action="?/feedback" class="grid gap-2">
				<input type="hidden" name="check_in_id" value={checkIn.id} />
				<label class="grid gap-1"
					>Your feedback
					<textarea name="feedback" rows="3" maxlength="4000" required
						>{checkIn.coach_feedback ?? ''}</textarea
					>
				</label>
				<button class={secondary}>Save feedback</button>
			</form>
		</article>
	{/each}
</section>

<section class={card}>
	<h2>Messages</h2>
	{#if data.client.coaching_mode !== 'human'}
		<p class={help}>The client can only read and reply to messages while on Human Coaching.</p>
	{/if}
	{#if data.messages.length === 0}
		<p>No messages yet.</p>
	{/if}
	<ul class="grid gap-3">
		{#each data.messages as message (message.id)}
			<li class="rounded-lg border border-line p-3">
				<strong>{message.sender_role === 'coach' ? 'You' : 'Client'}</strong>
				<span class={help}>{when(message.created_at)}</span>
				<p>{message.body}</p>
			</li>
		{/each}
	</ul>
	<form method="POST" action="?/reply" class="mt-4 grid gap-2">
		<label class="grid gap-1"
			>Reply
			<textarea name="body" rows="3" maxlength="2000" required></textarea>
		</label>
		<button class={primary}>Send message</button>
	</form>
</section>

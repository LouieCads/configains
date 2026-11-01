<script lang="ts">
	import {
		badgeNeutral,
		badgeOk,
		badgeWarn,
		card,
		error,
		help,
		primary,
		secondary,
		success
	} from '$lib/features/cms/styles';
	import { progressMetrics } from '$lib/coaching/progress';
	let { data, form } = $props();

	const when = (value: string) =>
		new Date(value).toLocaleDateString('en-GB', { dateStyle: 'medium' });
	const phases = $derived(data.program?.workout?.phases ?? []);
	const currentPhase = $derived(phases.find((phase) => phase.id === data.program?.currentPhaseId));
	const pending = $derived(data.checkIns.filter((checkIn) => !checkIn.coach_feedback));
	const answered = $derived(data.checkIns.filter((checkIn) => checkIn.coach_feedback));
	const thisWeek = $derived(data.progress.weekly[0]);
	const savedLabel: Record<string, string> = {
		assign: 'Program assigned.',
		phase: 'Phase updated.',
		customise: 'Workout customised for this client.',
		feedback: 'Feedback saved.',
		reply: 'Message sent.'
	};
	const tile = 'grid gap-1 rounded-[10px] border border-line bg-paper p-4 text-ink no-underline';
	const tileLabel = 'text-[0.75rem] font-bold tracking-[1px] text-muted uppercase';
</script>

<svelte:head><title>{data.client.display_name ?? 'Client'} | Configains CMS</title></svelte:head>
<p class="mb-0"><a class="text-cyan-ink" href="/admin/clients">← All clients</a></p>
<header class="mb-6 flex flex-wrap items-center gap-3">
	<h1 class="my-3!">{data.client.display_name ?? 'Unnamed client'}</h1>
	<span class={data.client.coaching_mode === 'human' ? badgeOk : badgeNeutral}
		>{data.client.coaching_mode === 'human' ? 'Human coaching' : 'AI coaching'}</span
	>
	<span class="text-[0.85rem] text-muted">Joined {when(data.client.created_at)}</span>
</header>

{#if form?.message}<p class={error} role="alert">{form.message}</p>{/if}
{#if form?.updated}<p class={success} role="status">
		{savedLabel[form.updated] ?? 'Saved.'}
	</p>{/if}

<div class="mb-8 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
	<a class="{tile} hover:border-cyan-ink" href="#program">
		<span class={tileLabel}>Program</span>
		<strong class="truncate">{data.program?.workout?.name ?? 'None yet'}</strong>
		{#if currentPhase}<span class="text-[0.85rem] text-muted">{currentPhase.name}</span>{/if}
	</a>
	<a class="{tile} hover:border-cyan-ink" href="#progress">
		<span class={tileLabel}>Workouts this week</span>
		<strong class="text-[1.75rem] leading-tight">{thisWeek?.workouts ?? 0}</strong>
	</a>
	<a
		class={[tile, 'hover:border-cyan-ink', pending.length > 0 && 'border-[#efb8ac]! bg-[#fff1ee]!']}
		href="#check-ins"
	>
		<span class={tileLabel}>Check-ins to review</span>
		<strong class="text-[1.75rem] leading-tight">{pending.length}</strong>
	</a>
	<a class="{tile} hover:border-cyan-ink" href="#messages">
		<span class={tileLabel}>Messages</span>
		<strong class="text-[1.75rem] leading-tight">{data.messages.length}</strong>
	</a>
</div>

<div class="grid gap-6">
	<section id="check-ins" class={card}>
		<h2>Check-ins</h2>
		{#if data.checkIns.length === 0}
			<p class="text-muted">No check-ins yet.</p>
		{:else if pending.length === 0}
			<p class="text-muted">All caught up.</p>
		{/if}
		{#each pending as checkIn (checkIn.id)}
			<article class="mb-4 grid gap-2 rounded-lg border border-line p-4">
				<p class="m-0 flex flex-wrap items-center gap-2">
					<span class={badgeWarn}>Needs feedback</span>
					<span class="text-[0.85rem] text-muted">{when(checkIn.submitted_on)}</span>
				</p>
				<p class="m-0 whitespace-pre-line">{checkIn.body}</p>
				<form method="POST" action="?/feedback" class="grid gap-2">
					<input type="hidden" name="check_in_id" value={checkIn.id} />
					<label class="grid gap-1 font-semibold"
						>Your feedback
						<textarea name="feedback" rows="3" maxlength="4000" required></textarea>
					</label>
					<button class="{primary} justify-self-start">Send feedback</button>
				</form>
			</article>
		{/each}
		{#if answered.length > 0}
			<details>
				<summary class="cursor-pointer font-semibold text-cyan-ink"
					>Answered check-ins ({answered.length})</summary
				>
				{#each answered as checkIn (checkIn.id)}
					<article class="mt-4 grid gap-2 border-b border-line pb-4">
						<p class="m-0 text-[0.85rem] text-muted">{when(checkIn.submitted_on)}</p>
						<p class="m-0 whitespace-pre-line">{checkIn.body}</p>
						<form method="POST" action="?/feedback" class="grid gap-2">
							<input type="hidden" name="check_in_id" value={checkIn.id} />
							<label class="grid gap-1 font-semibold"
								>Your feedback
								<textarea name="feedback" rows="3" maxlength="4000" required
									>{checkIn.coach_feedback ?? ''}</textarea
								>
							</label>
							<button class="{secondary} justify-self-start">Update feedback</button>
						</form>
					</article>
				{/each}
			</details>
		{/if}
	</section>

	<section id="messages" class={card}>
		<h2>Messages</h2>
		{#if data.client.coaching_mode !== 'human'}
			<p class={help}>The client can read and reply only while on Human coaching.</p>
		{/if}
		{#if data.messages.length === 0}
			<p class="text-muted">No messages yet.</p>
		{/if}
		<ul class="m-0 grid max-h-[480px] list-none gap-2 overflow-y-auto p-0">
			{#each data.messages as message (message.id)}
				{@const mine = message.sender_role === 'coach'}
				<li
					class={[
						'max-w-[85%] rounded-xl px-4 py-2',
						mine ? 'justify-self-end bg-[#e3f3f5]' : 'justify-self-start bg-[#eef3f3]'
					]}
				>
					<p class="m-0 text-[0.75rem] text-muted">
						{mine ? 'You' : 'Client'} · {when(message.created_at)}
					</p>
					<p class="m-0 whitespace-pre-line">{message.body}</p>
				</li>
			{/each}
		</ul>
		<form method="POST" action="?/reply" class="mt-4 grid gap-2">
			<label class="grid gap-1 font-semibold"
				>Reply
				<textarea name="body" rows="3" maxlength="2000" required></textarea>
			</label>
			<button class="{primary} justify-self-start">Send message</button>
		</form>
	</section>

	<section id="program" class={card}>
		<h2>Program</h2>
		{#if data.program}
			<p class="m-0 text-[1.1rem] font-semibold">{data.program.workout?.name ?? 'No workout'}</p>
			<p class={help}>
				{data.program.source === 'ai' ? 'Matched by AI Coaching' : 'Assigned by you'}{data.program
					.nutrition
					? ` · Nutrition: ${data.program.nutrition.name}`
					: ''}{data.program.customised ? ' · Customised for this client' : ''}
			</p>

			{#if phases.length > 0}
				<form method="POST" action="?/phase" class="mt-4 flex flex-wrap items-end gap-3">
					<input type="hidden" name="program_id" value={data.program.id} />
					<label class="grid min-w-[220px] flex-1 gap-1 font-semibold"
						>Current phase
						<select name="phase_id">
							{#each phases as phase (phase.id)}
								<option value={phase.id} selected={phase.id === data.program.currentPhaseId}
									>{phase.name}</option
								>
							{/each}
						</select>
					</label>
					<button class={primary}>Update phase</button>
				</form>
			{/if}

			{#if !data.program.customised}
				<form method="POST" action="?/customise" class="mt-4">
					<input type="hidden" name="program_id" value={data.program.id} />
					<button class={secondary}>Customise workout for this client</button>
					<p class={help}>Makes a private copy. Your library template stays unchanged.</p>
				</form>
			{/if}
		{:else}
			<p class="text-muted">No program yet.</p>
		{/if}

		<details class="mt-4 border-t border-line pt-4" open={!data.program}>
			<summary class="cursor-pointer font-semibold text-cyan-ink"
				>{data.program ? 'Change program' : 'Assign a program'}</summary
			>
			{#if data.workoutTemplates.length === 0}
				<p class="text-muted">
					Create a workout in <a href="/admin/templates">Templates</a> first.
				</p>
			{:else}
				<form method="POST" action="?/assign" class="mt-3 grid gap-3">
					<label class="grid gap-1 font-semibold"
						>Workout
						<select name="workout_template_id" required>
							{#each data.workoutTemplates as template (template.id)}
								<option value={template.id}>{template.name}</option>
							{/each}
						</select>
					</label>
					<label class="grid gap-1 font-semibold"
						>Nutrition (optional)
						<select name="nutrition_template_id">
							<option value="">None</option>
							{#each data.nutritionTemplates as template (template.id)}
								<option value={template.id}>{template.name}</option>
							{/each}
						</select>
					</label>
					{#if data.program}<p class={help}>
							Ends the current program and starts the new one on its first phase.
						</p>{/if}
					<button class="{primary} justify-self-start">Assign program</button>
				</form>
			{/if}
		</details>
	</section>

	<section id="progress" class={card}>
		<h2>Progress</h2>
		<div class="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
			<div class="rounded-lg bg-[#eef3f3] p-3">
				<p class="{tileLabel} m-0">Workouts this week</p>
				<p class="m-0 text-[1.4rem] font-semibold">{thisWeek?.workouts ?? 0}</p>
			</div>
			{#each progressMetrics as metric (metric.key)}
				<div class="rounded-lg bg-[#eef3f3] p-3">
					<p class="{tileLabel} m-0">{metric.label}</p>
					<p class="m-0 text-[1.4rem] font-semibold">
						{thisWeek?.averages[metric.key] !== undefined
							? `${thisWeek.averages[metric.key]} ${metric.unit}`
							: '—'}
					</p>
				</div>
			{/each}
		</div>
		<h3 class="mt-6 mb-2 font-semibold">Recent workouts</h3>
		{#if data.progress.logs.length === 0}<p class="text-muted">No workouts logged yet.</p>{/if}
		<ul class="m-0 grid list-none gap-0 p-0">
			{#each data.progress.logs.slice(0, 10) as log (log.id)}
				<li class="flex flex-wrap gap-x-3 border-b border-line py-2 last:border-b-0">
					<span class="min-w-28">{when(log.logged_on)}</span>
					<span class={log.completed ? 'text-[#175e4d]' : 'text-muted'}
						>{log.completed ? 'Completed' : 'Not completed'}</span
					>
					{#if log.duration_minutes}<span class="text-muted">{log.duration_minutes} min</span>{/if}
				</li>
			{/each}
		</ul>
	</section>
</div>

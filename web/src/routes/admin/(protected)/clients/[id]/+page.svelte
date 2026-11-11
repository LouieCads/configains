<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRightLeft from '@lucide/svelte/icons/arrow-right-left';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import Copy from '@lucide/svelte/icons/copy';
	import MessageSquare from '@lucide/svelte/icons/message-square';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Send from '@lucide/svelte/icons/send';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import X from '@lucide/svelte/icons/x';
	import Repeat from '@lucide/svelte/icons/repeat';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { answerSummary, assessmentStatus, healthLabel } from '$lib/coaching/labels';
	import { progressMetrics } from '$lib/coaching/progress';
	import AssignProgramForm from '$lib/features/coaching/AssignProgramForm.svelte';
	import {
		badgeNeutral,
		badgeOk,
		badgeWarn,
		card,
		error,
		help,
		primary,
		secondary,
		subtle,
		success,
		tabIdle,
		tabSelected,
		requiredMark
	} from '$lib/features/cms/styles';
	let { data, form } = $props();

	const when = (value: string) =>
		new Date(value).toLocaleDateString('en-GB', { dateStyle: 'medium' });
	const phases = $derived(data.program?.workout?.phases ?? []);
	const currentPhase = $derived(phases.find((phase) => phase.id === data.program?.currentPhaseId));
	const pending = $derived(data.checkIns.filter((checkIn) => !checkIn.coach_feedback));
	const answered = $derived(data.checkIns.filter((checkIn) => checkIn.coach_feedback));
	const thisWeek = $derived(data.progress.weekly[0]);
	const metricsWithData = $derived(
		progressMetrics.filter((metric) => thisWeek?.averages[metric.key] !== undefined)
	);
	const isHuman = $derived(data.client.coaching_mode === 'human');
	const flags = $derived(data.assessment?.red_flags ?? []);
	/** Check-ins and messages belong to human coaching, so AI clients show them only if history exists. */
	const showThread = $derived(isHuman || data.checkIns.length > 0 || data.messages.length > 0);
	const summary = $derived(answerSummary(data.assessment?.answers));
	const status = $derived(data.assessment ? assessmentStatus[data.assessment.status] : null);
	const toneClass = { ok: badgeOk, warn: badgeWarn, neutral: badgeNeutral } as const;

	// The library ids of the current program, so "Change program" starts from what the client has.
	const currentSelection = $derived({
		workoutId: data.program?.customised ? null : (data.program?.workout?.id ?? null),
		nutritionId: data.program?.nutrition?.id ?? null
	});

	const savedLabel: Record<string, string> = {
		assign: 'Program assigned.',
		phase: 'Phase updated.',
		feedback: 'Feedback sent.',
		reply: 'Message sent.',
		mode: 'Coaching mode changed.'
	};

	let changing = $state(false);
	let busy = $state<string | null>(null);
	/** Keeps the page where it is after a save and shows which form is working. */
	const keepPlace =
		(key: string, reset = true): SubmitFunction =>
		() => {
			busy = key;
			return async ({ update, result }) => {
				await update({ reset });
				busy = null;
				if (result.type === 'success' && key === 'assign') changing = false;
			};
		};

	let messageList = $state<HTMLUListElement>();
	$effect(() => {
		void data.messages.length;
		messageList?.scrollTo({ top: messageList.scrollHeight });
	});
	/** Ctrl or Cmd + Enter sends a message or feedback. */
	function sendOnShortcut(event: KeyboardEvent) {
		if (event.key === 'Enter' && (event.ctrlKey || event.metaKey))
			(event.currentTarget as HTMLTextAreaElement).form?.requestSubmit();
	}

	// One look for every card: same title size, same header row, same key/value rows.
	const cardHead = 'mb-4 flex min-h-9 flex-wrap items-center justify-between gap-3';
	const title = 'mb-0! text-[1.5rem]!';
	const subhead = 'mb-3 text-[1rem] font-bold';
	const label = 'text-[0.75rem] font-bold tracking-[1px] text-muted uppercase';
	const rows = 'm-0 grid list-none gap-0 p-0';
	const row =
		'flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line py-2.5 first:pt-0 last:border-b-0 last:pb-0';
	const rowKey = 'm-0 text-[0.9rem] text-muted';
	const rowValue = 'm-0 text-right font-semibold';
	const attention =
		'inline-flex items-center gap-2 rounded-full border border-current px-4 py-2 text-[0.9rem] font-semibold text-[#962f24] no-underline hover:underline';
</script>

<svelte:head><title>{data.client.display_name ?? 'Client'} | Configains CMS</title></svelte:head>

<p class="mb-0">
	<a class="inline-flex items-center gap-1 text-cyan-ink" href="/admin/clients"
		><ArrowLeft size={16} aria-hidden="true" />All clients</a
	>
</p>
<header class="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1">
	<h1 class="my-3! mr-auto">{data.client.display_name ?? 'Unnamed client'}</h1>
	<span class={isHuman ? badgeOk : badgeNeutral}>{isHuman ? 'Human coaching' : 'AI coaching'}</span>
	<form method="POST" action="?/mode" class="m-0" use:enhance={keepPlace('mode')}>
		<input type="hidden" name="mode" value={isHuman ? 'ai' : 'human'} />
		<button class={subtle} disabled={busy === 'mode'}
			><ArrowRightLeft size={16} aria-hidden="true" />Switch to {isHuman ? 'AI' : 'human'}</button
		>
	</form>
	<span class="w-full text-[0.85rem] text-muted">Joined {when(data.client.created_at)}</span>
</header>

{#if form?.message}<p class={error} role="alert">{form.message}</p>{/if}
{#if form?.updated}<p class={success} role="status">
		{savedLabel[form.updated] ?? 'Saved.'}
	</p>{/if}

<!-- Only what needs the coach right now. Nothing renders when the client is up to date. -->
{#if flags.length > 0 || pending.length > 0 || !data.program}
	<ul class="mb-6 flex list-none flex-wrap gap-2 p-0" aria-label="Needs your attention">
		{#if flags.length > 0}
			<li>
				<a class={attention} href="#assessment"
					><TriangleAlert size={16} aria-hidden="true" />Health: {flags
						.map(healthLabel)
						.join(', ')}</a
				>
			</li>
		{/if}
		{#if !data.program}
			<li>
				<a class={attention} href="#program"
					><ClipboardList size={16} aria-hidden="true" />No program assigned</a
				>
			</li>
		{/if}
		{#if pending.length > 0}
			<li>
				<a class={attention} href="#check-ins"
					><MessageSquare size={16} aria-hidden="true" />{pending.length} check-in{pending.length ===
					1
						? ''
						: 's'} to review</a
				>
			</li>
		{/if}
	</ul>
{/if}

<div class="grid items-start gap-6 min-[1100px]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
	<!-- Main column: the coaching work. -->
	<div class="grid min-w-0 gap-6">
		<section id="program" class={card}>
			<div class={cardHead}>
				<h2 class={title}>Program</h2>
				{#if data.program}
					<button
						type="button"
						class={subtle}
						aria-expanded={changing}
						aria-controls="change-program"
						onclick={() => (changing = !changing)}
						>{#if changing}<X size={16} aria-hidden="true" />Cancel{:else}<Repeat
								size={16}
								aria-hidden="true"
							/>Change program{/if}</button
					>
				{/if}
			</div>

			{#if data.program}
				<dl class={rows}>
					<div class={row}>
						<dt class={rowKey}>Workout</dt>
						<dd class={rowValue}>
							{data.program.workout?.name ?? 'None'}
							{#if data.program.customised}<span class="{badgeOk} ml-2">Customised</span>{/if}
						</dd>
					</div>
					{#if data.program.nutrition}
						<div class={row}>
							<dt class={rowKey}>Nutrition</dt>
							<dd class={rowValue}>{data.program.nutrition.name}</dd>
						</div>
					{/if}
					<div class={row}>
						<dt class={rowKey}>Set by</dt>
						<dd class={rowValue}>{data.program.source === 'ai' ? 'AI match' : 'You'}</dd>
					</div>
				</dl>

				{#if phases.length > 1}
					<form method="POST" action="?/phase" class="mt-5" use:enhance={keepPlace('phase')}>
						<input type="hidden" name="program_id" value={data.program.id} />
						<p class="{label} mb-2" id="phase-label">Current phase</p>
						<div class="flex flex-wrap gap-2" role="group" aria-labelledby="phase-label">
							{#each phases as phase (phase.id)}
								{@const current = phase.id === data.program.currentPhaseId}
								<button
									name="phase_id"
									value={phase.id}
									class={current ? tabSelected : tabIdle}
									aria-pressed={current}
									disabled={busy === 'phase' || current}>{phase.name}</button
								>
							{/each}
						</div>
					</form>
				{:else if currentPhase}
					<p class="{help} mt-3! mb-0!">Phase: {currentPhase.name}</p>
				{/if}

				<div class="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
					{#if data.program.customised && data.program.workout}
						<a
							class={secondary}
							href="/admin/templates/{data.program.workout.id}?client={data.client.id}"
							><Pencil size={18} aria-hidden="true" />Edit this client's workout</a
						>
					{:else}
						<form
							method="POST"
							action="?/customise"
							class="m-0"
							use:enhance={keepPlace('customise')}
						>
							<input type="hidden" name="program_id" value={data.program.id} />
							<button class={secondary} disabled={busy === 'customise'}
								><Copy size={18} aria-hidden="true" />Customise for this client</button
							>
						</form>
						<p class="{help} m-0!">Edits a private copy for this client.</p>
					{/if}
				</div>
			{/if}

			{#if !data.program || changing}
				<div id="change-program" class={data.program ? 'mt-5 border-t border-line pt-5' : ''}>
					{#if !data.program && (data.recommended.workoutId || data.recommended.nutritionId)}
						<p class="{help} mt-0!">Recommended picks are preselected.</p>
					{/if}
					<AssignProgramForm
						workouts={data.workoutTemplates}
						nutrition={data.nutritionTemplates}
						recommended={data.recommended}
						selected={data.program ? currentSelection : undefined}
						allowCustomise
						note={data.program ? 'Replaces the current program.' : ''}
					/>
				</div>
			{/if}
		</section>

		<section id="conversation" class={card}>
			<div class={cardHead}>
				<h2 class={title}>Conversation</h2>
				{#if pending.length > 0}<span class={badgeWarn}>{pending.length} to review</span>{/if}
			</div>

			{#if !showThread}
				<p class="m-0 text-muted">
					Check-ins and messages are part of human coaching. Switch this client to human to turn
					them on.
				</p>
			{:else}
				<div id="check-ins">
					<h3 class={subhead}>Check-ins</h3>
					{#if data.checkIns.length === 0}
						<p class="m-0 text-muted">None yet.</p>
					{:else if pending.length === 0}
						<p class="m-0 text-muted">All answered.</p>
					{/if}
					{#each pending as checkIn (checkIn.id)}
						<article class="mb-4 grid gap-2 rounded-lg border border-[#efb8ac] p-4 last:mb-0">
							<p class="m-0 text-[0.85rem] text-muted">{when(checkIn.submitted_on)}</p>
							<p class="m-0 whitespace-pre-line">{checkIn.body}</p>
							<form
								method="POST"
								action="?/feedback"
								class="m-0 grid gap-2"
								use:enhance={keepPlace(`feedback-${checkIn.id}`)}
							>
								<input type="hidden" name="check_in_id" value={checkIn.id} />
								<label class="sr-only" for="feedback-{checkIn.id}">Your feedback</label>
								<textarea
									id="feedback-{checkIn.id}"
									name="feedback"
									rows="3"
									maxlength="4000"
									required
									placeholder="Your feedback *"
									onkeydown={sendOnShortcut}></textarea>
								<button class={primary} disabled={busy === `feedback-${checkIn.id}`}
									><Send size={18} aria-hidden="true" />Send feedback</button
								>
							</form>
						</article>
					{/each}
					{#if answered.length > 0}
						<details class="mt-3">
							<summary class="cursor-pointer font-semibold text-cyan-ink"
								>Answered ({answered.length})</summary
							>
							{#each answered as checkIn (checkIn.id)}
								<article class="mt-4 grid gap-2 border-b border-line pb-4 last:border-b-0">
									<p class="m-0 text-[0.85rem] text-muted">{when(checkIn.submitted_on)}</p>
									<p class="m-0 whitespace-pre-line">{checkIn.body}</p>
									<form
										method="POST"
										action="?/feedback"
										class="m-0 grid gap-2"
										use:enhance={keepPlace(`feedback-${checkIn.id}`, false)}
									>
										<input type="hidden" name="check_in_id" value={checkIn.id} />
										<label class="grid gap-1 text-[0.85rem] font-semibold"
											><span
												>Your feedback<span class={requiredMark} aria-hidden="true">*</span></span
											>
											<textarea name="feedback" rows="2" maxlength="4000" required
												>{checkIn.coach_feedback ?? ''}</textarea
											>
										</label>
										<button class={subtle} disabled={busy === `feedback-${checkIn.id}`}
											><Pencil size={16} aria-hidden="true" />Update feedback</button
										>
									</form>
								</article>
							{/each}
						</details>
					{/if}
				</div>

				<div id="messages" class="mt-6 border-t border-line pt-6">
					<h3 class={subhead}>Messages</h3>
					{#if data.messages.length === 0}
						<p class="m-0 text-muted">None yet.</p>
					{:else}
						<ul bind:this={messageList} class="{rows} max-h-[420px] gap-2 overflow-y-auto">
							{#each data.messages as message (message.id)}
								{@const mine = message.sender_role === 'coach'}
								<li
									class={[
										'max-w-[85%] rounded-xl px-4 py-2',
										mine
											? 'justify-self-end border border-cyan-ink'
											: 'justify-self-start border border-[#b7c6c7]'
									]}
								>
									<p class="m-0 text-[0.75rem] text-muted">
										<span class="font-semibold">{mine ? 'You' : 'Client'}</span>
										<span class="ml-2">{when(message.created_at)}</span>
									</p>
									<p class="m-0 whitespace-pre-line">{message.body}</p>
								</li>
							{/each}
						</ul>
					{/if}
					{#if isHuman}
						<form
							method="POST"
							action="?/reply"
							class="mt-4 grid gap-2"
							use:enhance={keepPlace('reply')}
						>
							<label class="sr-only" for="reply-body">Reply</label>
							<textarea
								id="reply-body"
								name="body"
								rows="2"
								maxlength="2000"
								required
								placeholder="Write a message *"
								onkeydown={sendOnShortcut}></textarea>
							<div class="flex flex-wrap items-center gap-3">
								<button class={primary} disabled={busy === 'reply'}
									><Send size={18} aria-hidden="true" />Send</button
								>
								<span class="{help} m-0!">Ctrl + Enter to send</span>
							</div>
						</form>
					{:else}
						<p class="{help} mb-0!">History only. Switch to human coaching to reply.</p>
					{/if}
				</div>
			{/if}
		</section>
	</div>

	<!-- Side column: context about the client. -->
	<div class={['grid min-w-0 gap-6', !data.program && 'order-first min-[1100px]:order-none']}>
		<section id="assessment" class={card}>
			<div class={cardHead}>
				<h2 class={title}>Assessment</h2>
				{#if status}<span class={toneClass[status.tone]}>{status.label}</span>{/if}
			</div>
			{#if !data.assessment}
				<p class="m-0 text-muted">Not taken yet.</p>
			{:else}
				<dl class={rows}>
					{#each summary as item (item.label)}
						<div class={row}>
							<dt class={rowKey}>{item.label}</dt>
							<dd class={rowValue}>{item.value}</dd>
						</div>
					{/each}
					<div class={row}>
						<dt class={rowKey}>Submitted</dt>
						<dd class={rowValue}>{when(data.assessment.created_at)}</dd>
					</div>
				</dl>
				{#if data.assessment.explanation}
					<div class="mt-4 rounded-lg border border-[#b7c6c7] p-3 text-[0.9rem]">
						<p class="{label} mb-1">AI note</p>
						<p class="m-0">{data.assessment.explanation}</p>
					</div>
				{/if}
			{/if}
		</section>

		<section id="progress" class={card}>
			<div class={cardHead}>
				<h2 class={title}>Progress</h2>
			</div>
			{#if data.progress.logs.length === 0 && !thisWeek?.workouts}
				<p class="m-0 text-muted">No workouts logged yet.</p>
			{:else}
				<h3 class={subhead}>This week</h3>
				<dl class={rows}>
					<div class={row}>
						<dt class={rowKey}>Workouts</dt>
						<dd class={rowValue}>{thisWeek?.workouts ?? 0}</dd>
					</div>
					{#each metricsWithData as metric (metric.key)}
						<div class={row}>
							<dt class={rowKey}>{metric.label}</dt>
							<dd class={rowValue}>{thisWeek?.averages[metric.key]} {metric.unit}</dd>
						</div>
					{/each}
				</dl>
				<h3 class="{subhead} mt-6">Recent workouts</h3>
				<ul class={rows}>
					{#each data.progress.logs.slice(0, 5) as log (log.id)}
						<li class={row}>
							<span class={rowKey}>{when(log.logged_on)}</span>
							<span class={['font-semibold', log.completed ? 'text-[#175e4d]' : 'text-muted']}
								>{log.completed ? 'Completed' : 'Not completed'}{log.duration_minutes
									? `, ${log.duration_minutes} min`
									: ''}</span
							>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</div>
</div>

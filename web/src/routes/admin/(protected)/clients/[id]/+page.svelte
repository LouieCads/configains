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
	import Archive from '@lucide/svelte/icons/archive';
	import ArchiveRestore from '@lucide/svelte/icons/archive-restore';
	import Check from '@lucide/svelte/icons/check';
	import Mail from '@lucide/svelte/icons/mail';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { answerSummary, assessmentStatus, healthLabel } from '$lib/coaching/labels';
	import { progressMetrics } from '$lib/coaching/progress';
	import { phaseTiming, phaseTimingLabel } from '$lib/coaching/phase-timing';
	import CalendarClock from '@lucide/svelte/icons/calendar-clock';
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
		secondaryDanger,
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
	const timing = $derived(
		data.program && currentPhase
			? phaseTiming(data.program.phaseStartedAt, currentPhase.duration_weeks)
			: null
	);
	const timingLabel = $derived(
		timing && currentPhase ? phaseTimingLabel(timing, currentPhase.id === phases.at(-1)?.id) : ''
	);
	const unread = $derived(
		data.messages.filter((message) => message.sender_role === 'client' && !message.read_at).length
	);
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
		mode: 'Coaching mode changed.',
		rename: 'Name saved.',
		archive: 'Client archived.',
		restore: 'Client restored.',
		resend: 'A new invitation was sent.'
	};

	let renaming = $state(false);
	const archived = $derived(Boolean(data.client.archived_at));
	const clientName = $derived(data.client.display_name ?? 'this client');
	const confirmDelete = (event: SubmitEvent) => {
		if (
			!confirm(
				`Delete ${clientName} for good? Their login, assessments, programs, logs, check-ins and messages are removed. This cannot be undone. To keep their history, archive them instead.`
			)
		)
			event.preventDefault();
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
				if (result.type === 'success' && key === 'rename') renaming = false;
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
	{#if renaming}
		<form
			method="POST"
			action="?/rename"
			class="my-3 mr-auto flex flex-wrap items-center gap-2"
			use:enhance={keepPlace('rename', false)}
		>
			<label class="sr-only" for="client-name">Client name</label>
			<!-- svelte-ignore a11y_autofocus -->
			<input
				id="client-name"
				name="display_name"
				maxlength="120"
				required
				autofocus
				value={data.client.display_name ?? ''}
				class="max-w-[320px]"
			/>
			<button class={primary} disabled={busy === 'rename'}
				><Check size={18} aria-hidden="true" />Save</button
			>
			<button type="button" class={subtle} onclick={() => (renaming = false)}
				><X size={16} aria-hidden="true" />Cancel</button
			>
		</form>
	{:else}
		<h1 class="my-3! mr-auto flex flex-wrap items-center gap-2">
			{data.client.display_name ?? 'Unnamed client'}
			<button
				type="button"
				class={subtle}
				aria-label="Edit name"
				title="Edit name"
				onclick={() => (renaming = true)}><Pencil size={18} aria-hidden="true" /></button
			>
		</h1>
	{/if}
	{#if archived}<span class={badgeNeutral}>Archived</span>{/if}
	<span class={isHuman ? badgeOk : badgeNeutral}>{isHuman ? 'Human coaching' : 'AI coaching'}</span>
	<form method="POST" action="?/mode" class="m-0" use:enhance={keepPlace('mode')}>
		<input type="hidden" name="mode" value={isHuman ? 'ai' : 'human'} />
		<button class={subtle} disabled={busy === 'mode'}
			><ArrowRightLeft size={16} aria-hidden="true" />Switch to {isHuman ? 'AI' : 'human'}</button
		>
	</form>
	<span class="flex w-full flex-wrap items-center gap-x-3 gap-y-1 text-[0.85rem] text-muted">
		{#if data.invite?.email}<span>{data.invite.email}</span>{/if}
		<span>Joined {when(data.client.created_at)}</span>
		{#if data.invite && !data.invite.accepted}
			<span class={badgeWarn}>Invite not accepted</span>
			<form method="POST" action="?/resend" class="m-0" use:enhance={keepPlace('resend')}>
				<button class={subtle} disabled={busy === 'resend'}
					><Mail size={16} aria-hidden="true" />{busy === 'resend'
						? 'Sending…'
						: 'Resend invitation'}</button
				>
			</form>
		{/if}
	</span>
</header>

{#if form?.message}<p class={error} role="alert">{form.message}</p>{/if}
{#if form?.updated}<p class={success} role="status">
		{savedLabel[form.updated] ?? 'Saved.'}
	</p>{/if}

<!-- Only what needs the coach right now. Nothing renders when the client is up to date. -->
{#if flags.length > 0 || pending.length > 0 || !data.program || timing?.due || unread > 0}
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
		{#if timing?.due}
			<li>
				<a class={attention} href="#program"
					><CalendarClock size={16} aria-hidden="true" />{timingLabel}</a
				>
			</li>
		{/if}
		{#if unread > 0}
			<li>
				<a class={attention} href="#messages"
					><MessageSquare size={16} aria-hidden="true" />{unread} new message{unread === 1
						? ''
						: 's'}</a
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
				{#if timingLabel}
					<p
						class={[
							'mt-2! mb-0! text-[0.85rem]',
							timing?.due ? 'font-semibold text-[#962f24]' : 'text-muted'
						]}
					>
						{currentPhase?.name}: {timingLabel}{#if !timing?.weeks}. Set a phase length in the
							template to get reminders.{/if}
					</p>
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
										{#if !mine && !message.read_at}<span class="{badgeWarn} ml-2">New</span>{/if}
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

		<section id="manage" class={card}>
			<div class={cardHead}>
				<h2 class={title}>Manage client</h2>
			</div>
			<div class="grid gap-4">
				<form
					method="POST"
					action="?/archive"
					class="m-0 grid gap-1"
					use:enhance={keepPlace('archive')}
				>
					<input type="hidden" name="archive" value={archived ? '0' : '1'} />
					<button class={secondary} disabled={busy === 'archive'}
						>{#if archived}<ArchiveRestore size={18} aria-hidden="true" />Restore client{:else}<Archive
								size={18}
								aria-hidden="true"
							/>Archive client{/if}</button
					>
					<p class="{help} m-0!">
						{archived
							? 'Brings the client back into your lists and to-dos.'
							: 'Hides the client from your lists and to-dos. Their login and history stay.'}
					</p>
				</form>
				<form method="POST" action="?/delete" class="m-0 grid gap-1" onsubmit={confirmDelete}>
					<button class={secondaryDanger}
						><Trash2 size={18} aria-hidden="true" />Delete client</button
					>
					<p class="{help} m-0!">
						Removes the login and all coaching data for good. Useful for test accounts.
					</p>
				</form>
			</div>
		</section>
	</div>
</div>

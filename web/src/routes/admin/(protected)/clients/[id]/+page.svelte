<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
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
	import AtSign from '@lucide/svelte/icons/at-sign';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import SkipForward from '@lucide/svelte/icons/skip-forward';
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
		mode: 'Coaching changed.',
		rename: 'Name saved.',
		archive: 'Client archived.',
		restore: 'Client restored.',
		resend: 'Invite sent again.'
	};

	const modes = [
		{ value: 'ai', label: 'AI' },
		{ value: 'human', label: 'Human' }
	] as const;
	const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;
	/** What needs the coach on this page, most urgent first. Each links to its card. */
	const todo = $derived(
		[
			flags.length > 0 && {
				label: `Health: ${flags.map(healthLabel).join(', ')}`,
				href: '#assessment',
				icon: TriangleAlert
			},
			!data.program && { label: 'Assign a program', href: '#program', icon: ClipboardList },
			timing?.due && { label: timingLabel, href: '#program', icon: CalendarClock },
			pending.length > 0 && {
				label: `Answer ${plural(pending.length, 'check-in')}`,
				href: '#check-ins',
				icon: MessageSquare
			},
			unread > 0 && {
				label: `Read ${plural(unread, 'new message')}`,
				href: '#messages',
				icon: Mail
			}
		].filter((item) => !!item)
	);

	const invitePending = $derived(Boolean(data.invite && !data.invite.accepted));
	const nextPhase = $derived(
		currentPhase ? phases[phases.findIndex((phase) => phase.id === currentPhase.id) + 1] : undefined
	);
	function focusReply(event: MouseEvent) {
		const box = document.getElementById('reply-body');
		if (!box) return;
		event.preventDefault();
		box.scrollIntoView({ block: 'center' });
		box.focus({ preventScroll: true });
	}
	function openChange() {
		changing = true;
		document.getElementById('program')?.scrollIntoView({ block: 'start' });
	}

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

	// Three text levels on every card: card title, small uppercase section label, then content.
	const cardHead = 'mb-4 flex min-h-9 flex-wrap items-center justify-between gap-3';
	const title = 'mb-0! text-[1.5rem]!';
	const quick =
		'inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-[#b7c6c7] bg-paper px-4 py-2 text-[0.875rem] font-semibold text-ink no-underline hover:border-cyan-ink disabled:cursor-not-allowed disabled:opacity-50';
	const sectionLabel = 'text-[0.75rem] font-bold tracking-[1px] text-muted uppercase';
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
		><ArrowLeft size={16} aria-hidden="true" />Clients</a
	>
</p>

<!-- Who the client is, and how they are coached. -->
<header class="mb-6 grid gap-2">
	<div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
		{#if renaming}
			<form
				method="POST"
				action="?/rename"
				class="my-3 flex flex-wrap items-center gap-2"
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
			<h1 class="my-3! flex flex-wrap items-center gap-2">
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

		<!-- One control for the coaching mode: the pressed option is the current one. -->
		<form method="POST" action="?/mode" class="m-0" use:enhance={keepPlace('mode')}>
			<div class="flex items-center gap-2" role="group" aria-labelledby="mode-label">
				<span id="mode-label" class={sectionLabel}>Coaching</span>
				{#each modes as mode (mode.value)}
					{@const active = data.client.coaching_mode === mode.value}
					<button
						name="mode"
						value={mode.value}
						class={active ? tabSelected : tabIdle}
						aria-pressed={active}
						disabled={active || busy === 'mode'}>{mode.label}</button
					>
				{/each}
			</div>
		</form>
	</div>

	<p class="m-0 flex flex-wrap items-center gap-x-5 gap-y-1 text-[0.9rem] text-muted">
		{#if data.invite?.email}<span class="inline-flex items-center gap-1.5"
				><AtSign size={15} aria-hidden="true" />{data.invite.email}</span
			>{/if}
		<span class="inline-flex items-center gap-1.5"
			><CalendarDays size={15} aria-hidden="true" />Joined {when(data.client.created_at)}</span
		>
		{#if archived}<span class={badgeNeutral}>Archived</span>{/if}
		{#if invitePending}<span class={badgeWarn}>Invite pending</span>{/if}
	</p>

	<!-- Quick actions: the jobs a coach does most, without scrolling. Only relevant ones show. -->
	{#if invitePending || isHuman || data.program}
		<div class="mt-3 flex flex-wrap gap-2" role="group" aria-label="Quick actions">
			{#if isHuman}
				<a class={quick} href="#reply-body" onclick={focusReply}
					><Send size={16} aria-hidden="true" />Message</a
				>
			{/if}
			{#if data.program && nextPhase}
				<form method="POST" action="?/phase" class="m-0" use:enhance={keepPlace('phase')}>
					<input type="hidden" name="program_id" value={data.program.id} />
					<button
						class={quick}
						name="phase_id"
						value={nextPhase.id}
						disabled={busy === 'phase'}
						title="Move to {nextPhase.name}"
						><SkipForward size={16} aria-hidden="true" />Next phase</button
					>
				</form>
			{/if}
			{#if data.program?.customised && data.program.workout}
				<a class={quick} href="/admin/templates/{data.program.workout.id}?client={data.client.id}"
					><Pencil size={16} aria-hidden="true" />Edit workout</a
				>
			{:else if data.program}
				<form method="POST" action="?/customise" class="m-0" use:enhance={keepPlace('customise')}>
					<input type="hidden" name="program_id" value={data.program.id} />
					<button
						class={quick}
						disabled={busy === 'customise'}
						title="Make a copy of the workout to edit for this client only"
						><Copy size={16} aria-hidden="true" />Customise workout</button
					>
				</form>
			{/if}
			{#if data.program}
				<button type="button" class={quick} onclick={openChange}
					><Repeat size={16} aria-hidden="true" />Change program</button
				>
			{/if}
			{#if invitePending}
				<form method="POST" action="?/resend" class="m-0" use:enhance={keepPlace('resend')}>
					<button class={quick} disabled={busy === 'resend'}
						><Mail size={16} aria-hidden="true" />{busy === 'resend'
							? 'Sending…'
							: 'Resend invite'}</button
					>
				</form>
			{/if}
		</div>
	{/if}
</header>

{#if form?.message}<p class={error} role="alert">{form.message}</p>{/if}
{#if form?.updated}<p class={success} role="status">
		{savedLabel[form.updated] ?? 'Saved.'}
	</p>{/if}

<!-- Only what needs the coach right now. Nothing renders when the client is up to date. -->
{#if todo.length > 0}
	<section class="mb-6" aria-labelledby="todo-label">
		<h2 id="todo-label" class="{sectionLabel} mb-2!">To do</h2>
		<ul class="m-0 flex list-none flex-wrap gap-2 p-0">
			{#each todo as item (item.label)}
				<li>
					<a class={attention} href={item.href}
						><item.icon size={16} aria-hidden="true" />{item.label}</a
					>
				</li>
			{/each}
		</ul>
	</section>
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
							/>Change{/if}</button
					>
				{/if}
			</div>

			{#if data.program}
				<dl class={rows}>
					<div class={row}>
						<dt class={rowKey}>Workout</dt>
						<dd class={rowValue}>
							{data.program.workout?.name ?? 'None'}
							{#if data.program.customised}<span class="{badgeOk} ml-2">Custom</span>{/if}
						</dd>
					</div>
					{#if data.program.nutrition}
						<div class={row}>
							<dt class={rowKey}>Nutrition</dt>
							<dd class={rowValue}>{data.program.nutrition.name}</dd>
						</div>
					{/if}
					<div class={row}>
						<dt class={rowKey}>Chosen by</dt>
						<dd class={rowValue}>{data.program.source === 'ai' ? 'AI' : 'You'}</dd>
					</div>
				</dl>

				{#if currentPhase}
					<div class="mt-6">
						<div class="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
							<h3 id="phase-label" class="{sectionLabel} m-0!">Phase</h3>
							{#if timingLabel}<span
									class={[
										'text-[0.85rem]',
										timing?.due ? 'font-semibold text-[#962f24]' : 'text-muted'
									]}>{timingLabel}</span
								>{/if}
						</div>
						{#if phases.length > 1}
							<form method="POST" action="?/phase" class="m-0" use:enhance={keepPlace('phase')}>
								<input type="hidden" name="program_id" value={data.program.id} />
								<div class="flex flex-wrap gap-2" role="group" aria-labelledby="phase-label">
									{#each phases as phase, index (phase.id)}
										{@const current = phase.id === data.program.currentPhaseId}
										<button
											name="phase_id"
											value={phase.id}
											class={current ? tabSelected : tabIdle}
											aria-pressed={current}
											disabled={busy === 'phase' || current}
											><span class="mr-1.5 opacity-60">{index + 1}</span>{phase.name}</button
										>
									{/each}
								</div>
							</form>
						{:else}
							<p class="m-0 font-semibold">{currentPhase.name}</p>
						{/if}
					</div>
				{/if}
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
				<h2 class={title}>Check-ins and messages</h2>
			</div>

			{#if !showThread}
				<p class="m-0 text-muted">Available with human coaching.</p>
			{:else}
				<div id="check-ins">
					<div class="mb-3 flex items-center justify-between gap-3">
						<h3 class="{sectionLabel} m-0!">Check-ins</h3>
						{#if pending.length > 0}<span class={badgeWarn}>{pending.length} to answer</span>{/if}
					</div>
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
									placeholder="Your feedback"
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
											><Pencil size={16} aria-hidden="true" />Update</button
										>
									</form>
								</article>
							{/each}
						</details>
					{/if}
				</div>

				<div id="messages" class="mt-6 border-t border-line pt-6">
					<div class="mb-3 flex items-center justify-between gap-3">
						<h3 class="{sectionLabel} m-0!">Messages</h3>
						{#if unread > 0}<span class={badgeWarn}>{unread} new</span>{/if}
					</div>
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
							<label class="sr-only" for="reply-body">Message</label>
							<textarea
								id="reply-body"
								name="body"
								rows="2"
								maxlength="2000"
								required
								placeholder="Write a message"
								onkeydown={sendOnShortcut}></textarea>
							<div class="flex flex-wrap items-center gap-3">
								<button class={primary} disabled={busy === 'reply'} title="Ctrl + Enter"
									><Send size={18} aria-hidden="true" />Send</button
								>
							</div>
						</form>
					{:else}
						<p class="{help} mb-0!">Switch to Human to reply.</p>
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
						<h3 class="{sectionLabel} mb-1!">AI note</h3>
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
				<h3 class="{sectionLabel} mb-3!">This week</h3>
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
				<h3 class="{sectionLabel} mt-6! mb-3!">Recent workouts</h3>
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

		<section id="account" class={card}>
			<div class={cardHead}>
				<h2 class={title}>Account</h2>
			</div>
			<div class="flex flex-wrap gap-3">
				<form method="POST" action="?/archive" class="m-0" use:enhance={keepPlace('archive')}>
					<input type="hidden" name="archive" value={archived ? '0' : '1'} />
					<button
						class={secondary}
						disabled={busy === 'archive'}
						title={archived
							? 'Show the client in your lists again'
							: 'Hide the client and keep their history'}
						>{#if archived}<ArchiveRestore size={18} aria-hidden="true" />Restore{:else}<Archive
								size={18}
								aria-hidden="true"
							/>Archive{/if}</button
					>
				</form>
				<form method="POST" action="?/delete" class="m-0" onsubmit={confirmDelete}>
					<button class={secondaryDanger}><Trash2 size={18} aria-hidden="true" />Delete</button>
				</form>
			</div>
		</section>
	</div>
</div>

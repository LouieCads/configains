<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRightLeft from '@lucide/svelte/icons/arrow-right-left';
	import Copy from '@lucide/svelte/icons/copy';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Send from '@lucide/svelte/icons/send';
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
	const isHuman = $derived(data.client.coaching_mode === 'human');
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

	const tile =
		'grid content-start gap-1 rounded-[10px] border border-line bg-paper p-4 text-ink no-underline hover:border-cyan-ink';
	const tileLabel = 'text-[0.75rem] font-bold tracking-[1px] text-muted uppercase';
	const sectionHead = 'mb-4 flex flex-wrap items-center justify-between gap-3';
</script>

<svelte:head><title>{data.client.display_name ?? 'Client'} | Configains CMS</title></svelte:head>
<p class="mb-0">
	<a class="inline-flex items-center gap-1 text-cyan-ink" href="/admin/clients"
		><ArrowLeft size={16} aria-hidden="true" />All clients</a
	>
</p>
<header class="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2">
	<h1 class="my-3! mr-auto">{data.client.display_name ?? 'Unnamed client'}</h1>
	<span class={isHuman ? badgeOk : badgeNeutral}>{isHuman ? 'Human coaching' : 'AI coaching'}</span>
	<form method="POST" action="?/mode" class="m-0" use:enhance={keepPlace('mode')}>
		<input type="hidden" name="mode" value={isHuman ? 'ai' : 'human'} />
		<button class={subtle} disabled={busy === 'mode'}
			><ArrowRightLeft size={16} aria-hidden="true" />Switch to {isHuman ? 'AI' : 'human'} coaching</button
		>
	</form>
	<span class="w-full text-[0.85rem] text-muted">Joined {when(data.client.created_at)}</span>
</header>

{#if form?.message}<p class={error} role="alert">{form.message}</p>{/if}
{#if form?.updated}<p class={success} role="status">
		{savedLabel[form.updated] ?? 'Saved.'}
	</p>{/if}

<div class="mb-8 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
	<a class={tile} href="#program">
		<span class={tileLabel}>Program</span>
		<strong class="truncate">{data.program?.workout?.name ?? 'None yet'}</strong>
		{#if currentPhase}<span class="truncate text-[0.85rem] text-muted">{currentPhase.name}</span
			>{/if}
	</a>
	<a class={[tile, pending.length > 0 && 'border-[#efb8ac]! bg-[#fff1ee]!']} href="#check-ins">
		<span class={tileLabel}>Check-ins to review</span>
		<strong class="text-[1.75rem] leading-tight">{pending.length}</strong>
	</a>
	<a class={tile} href="#progress">
		<span class={tileLabel}>Workouts this week</span>
		<strong class="text-[1.75rem] leading-tight">{thisWeek?.workouts ?? 0}</strong>
	</a>
	<a class={tile} href="#messages">
		<span class={tileLabel}>Messages</span>
		<strong class="text-[1.75rem] leading-tight">{data.messages.length}</strong>
	</a>
</div>

<div class="grid items-start gap-6 min-[1200px]:grid-cols-2">
	<!-- Setup: what the client told us and what they are on. First on small screens until a program exists. -->
	<div class={['grid min-w-0 gap-6', data.program && 'order-2 min-[1200px]:order-1']}>
		<section id="assessment" class={card}>
			<div class={sectionHead}>
				<h2 class="mb-0">Assessment</h2>
				{#if status}<span class={toneClass[status.tone]}>{status.label}</span>{/if}
			</div>
			{#if !data.assessment}
				<p class="m-0 text-muted">Not taken yet.</p>
			{:else}
				<p class="{help} mt-0!">Submitted {when(data.assessment.created_at)}</p>
				<dl class="m-0 grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3">
					{#each summary as item (item.label)}
						<div class="rounded-lg bg-[#eef3f3] px-3 py-2">
							<dt class="text-[0.75rem] text-muted">{item.label}</dt>
							<dd class="m-0 font-semibold">{item.value}</dd>
						</div>
					{/each}
				</dl>
				{#if data.assessment.red_flags.length > 0}
					<p class="{error} mb-0!">
						<strong>Health:</strong>
						{data.assessment.red_flags.map(healthLabel).join(', ')}. Review before training.
					</p>
				{/if}
				{#if data.assessment.explanation}
					<p class="mb-0! text-[0.9rem]">
						<strong>AI note:</strong>
						{data.assessment.explanation}
					</p>
				{/if}
			{/if}
		</section>

		<section id="program" class={card}>
			<div class={sectionHead}>
				<h2 class="mb-0">Program</h2>
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
				<p class="m-0 text-[1.1rem] font-semibold">{data.program.workout?.name ?? 'No workout'}</p>
				{#if data.program.nutrition}<p class="{help} mt-1! mb-0!">
						Nutrition: {data.program.nutrition.name}
					</p>{/if}
				<div class="mt-3 flex flex-wrap gap-2">
					<span class={badgeNeutral}
						>{data.program.source === 'ai' ? 'AI match' : 'Assigned by you'}</span
					>
					{#if data.program.customised}<span class={badgeOk}>Customised</span>{/if}
				</div>

				{#if phases.length > 1}
					<form method="POST" action="?/phase" class="mt-4" use:enhance={keepPlace('phase')}>
						<input type="hidden" name="program_id" value={data.program.id} />
						<p class="mb-2 text-[0.85rem] font-semibold" id="phase-label">Current phase</p>
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
				{/if}

				<div class="mt-4 flex flex-wrap items-center gap-3">
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
	</div>

	<!-- Ongoing coaching. -->
	<div class="grid min-w-0 gap-6">
		<section id="check-ins" class={card}>
			<div class={sectionHead}>
				<h2 class="mb-0">Check-ins</h2>
				{#if pending.length > 0}<span class={badgeWarn}>{pending.length} to review</span>{/if}
			</div>
			{#if data.checkIns.length === 0}
				<p class="m-0 text-muted">No check-ins yet.</p>
			{:else if pending.length === 0}
				<p class="m-0 text-muted">All caught up.</p>
			{/if}
			{#each pending as checkIn (checkIn.id)}
				<article class="mb-4 grid gap-2 rounded-lg border border-[#efb8ac] p-4">
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
				<details class="mt-2">
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
									><span>Your feedback<span class={requiredMark} aria-hidden="true">*</span></span>
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
		</section>

		<section id="messages" class={card}>
			<h2>Messages</h2>
			{#if !isHuman}
				<p class="{help} mt-0!">Client sees messages only on human coaching.</p>
			{/if}
			{#if data.messages.length === 0}
				<p class="text-muted">No messages yet.</p>
			{/if}
			<ul
				bind:this={messageList}
				class="m-0 grid max-h-[420px] list-none gap-2 overflow-y-auto p-0"
			>
				{#each data.messages as message (message.id)}
					{@const mine = message.sender_role === 'coach'}
					<li
						class={[
							'max-w-[85%] rounded-xl px-4 py-2',
							mine ? 'justify-self-end bg-[#e3f3f5]' : 'justify-self-start bg-[#eef3f3]'
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
			<form method="POST" action="?/reply" class="mt-4 grid gap-2" use:enhance={keepPlace('reply')}>
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
		</section>
	</div>
</div>

<section id="progress" class="{card} mt-6">
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
						: 'None'}
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

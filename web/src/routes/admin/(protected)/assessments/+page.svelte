<script lang="ts">
	import { enhance } from '$app/forms';
	import { answerSummary, assessmentStatus, healthLabel, openStatuses } from '$lib/coaching/labels';
	import AssignProgramForm from '$lib/features/coaching/AssignProgramForm.svelte';
	import {
		badgeNeutral,
		badgeOk,
		badgeWarn,
		card,
		error,
		subtle,
		success,
		tabIdle,
		tabSelected
	} from '$lib/features/cms/styles';
	let { data, form } = $props();

	const toneClass = { ok: badgeOk, warn: badgeWarn, neutral: badgeNeutral } as const;
	const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

	const open = $derived(data.assessments.filter((row) => openStatuses.includes(row.status)));
	// Start on the queue; fall back to everything when the queue is empty.
	let view = $state<'open' | 'all' | null>(null);
	const shown = $derived(view ?? (open.length > 0 ? 'open' : 'all'));
	const rows = $derived(shown === 'open' ? open : data.assessments);
	const nameOf = (id: string | null, list: { id: string; name: string }[]) =>
		list.find((item) => item.id === id)?.name ?? null;
</script>

<svelte:head><title>Assessments | Configains CMS</title></svelte:head>
<div class="grid gap-6">
	<h1 class="mt-3! mb-0!">Assessments</h1>

	{#if form?.message}<p class="{error} m-0!" role="alert">{form.message}</p>{/if}
	{#if form?.updated}<p class="{success} m-0!" role="status">{form.updated}</p>{/if}
	{#if data.loadError}<p class="{error} m-0!" role="alert">{data.loadError}</p>{/if}

	{#if data.assessments.length === 0 && !data.loadError}
		<p class="m-0 rounded-[10px] border border-dashed border-line p-6 text-center text-muted">
			No assessments yet.
		</p>
	{:else if data.assessments.length > 0}
		<div class="flex flex-wrap gap-2" role="group" aria-label="Show assessments">
			<button
				type="button"
				class={shown === 'open' ? tabSelected : tabIdle}
				aria-pressed={shown === 'open'}
				onclick={() => (view = 'open')}
				>To review <span class="ml-2 text-[0.8rem] font-normal opacity-75">{open.length}</span
				></button
			>
			<button
				type="button"
				class={shown === 'all' ? tabSelected : tabIdle}
				aria-pressed={shown === 'all'}
				onclick={() => (view = 'all')}
				>All <span class="ml-2 text-[0.8rem] font-normal opacity-75">{data.assessments.length}</span
				></button
			>
		</div>

		{#if rows.length === 0}
			<p class="m-0 rounded-[10px] border border-dashed border-line p-6 text-center text-muted">
				All caught up.
			</p>
		{/if}

		<ul class="m-0 grid list-none gap-4 p-0">
			{#each rows as row (row.id)}
				{@const status = assessmentStatus[row.status]}
				{@const isOpen = openStatuses.includes(row.status)}
				{@const workout = nameOf(row.recommended.workoutId, data.workoutTemplates)}
				{@const nutrition = nameOf(row.recommended.nutritionId, data.nutritionTemplates)}
				<li class="{card} grid gap-4">
					<header class="flex flex-wrap items-center gap-x-3 gap-y-1">
						<a
							class="mr-auto text-[1.05rem] font-bold text-ink no-underline hover:text-cyan-ink"
							href="/admin/clients/{row.client_id}"
							>{row.client?.display_name ?? 'Unnamed client'} <span aria-hidden="true">→</span></a
						>
						<span class={toneClass[status?.tone ?? 'neutral']}>{status?.label ?? row.status}</span>
						<span class="w-full text-[0.8rem] text-muted"
							>{dateFormat.format(new Date(row.created_at))}</span
						>
					</header>

					<ul class="m-0 flex list-none flex-wrap gap-2 p-0">
						{#each answerSummary(row.answers) as item (item.label)}
							<li class="rounded-full bg-[#eef3f3] px-3 py-1 text-[0.85rem]">
								<span class="text-muted">{item.label}:</span>
								<strong class="font-semibold">{item.value}</strong>
							</li>
						{/each}
					</ul>

					{#if row.red_flags.length > 0}
						<p class="{error} m-0!">
							<strong>Health:</strong>
							{row.red_flags.map(healthLabel).join(', ')}. Review before assigning.
						</p>
					{/if}
					{#if row.explanation}
						<p class="m-0! text-[0.9rem]"><strong>AI note:</strong> {row.explanation}</p>
					{/if}

					{#if isOpen}
						<div class="grid gap-3 border-t border-line pt-4">
							{#if workout}
								<p class="m-0! text-[0.9rem]">
									<strong>Recommended:</strong>
									{workout}{nutrition ? ` + ${nutrition}` : ''}
								</p>
							{/if}
							<AssignProgramForm
								clientId={row.client_id}
								workouts={data.workoutTemplates}
								nutrition={data.nutritionTemplates}
								recommended={row.recommended}
								submitLabel={workout ? 'Assign' : 'Assign program'}
							/>
							<div class="flex flex-wrap gap-1">
								{#if row.client?.coaching_mode !== 'human'}
									<form method="POST" action="?/human" class="m-0!" use:enhance>
										<input type="hidden" name="client_id" value={row.client_id} />
										<button class={subtle}>Move to human coaching</button>
									</form>
								{/if}
								<form method="POST" action="?/review" class="m-0!" use:enhance>
									<input type="hidden" name="client_id" value={row.client_id} />
									<button class={subtle}>Mark reviewed</button>
								</form>
							</div>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>

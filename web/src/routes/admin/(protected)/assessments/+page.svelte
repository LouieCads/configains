<script lang="ts">
	import { goals, experienceLevels, trainingLocations } from '$lib/coaching/options';
	import {
		badgeNeutral,
		badgeOk,
		badgeWarn,
		card,
		error,
		flow,
		help,
		primary,
		secondary,
		success
	} from '$lib/features/cms/styles';
	let { data, form } = $props();

	const label = (options: readonly { value: string; label: string }[], value: string) =>
		options.find((option) => option.value === value)?.label ?? value;
	const statusLabel: Record<string, string> = {
		submitted: 'Waiting for matching',
		ai_matched: 'AI Coaching plan',
		needs_human_review: 'Needs Cash review',
		human_assigned: 'Human coaching'
	};
	const statusBadge: Record<string, string> = {
		submitted: badgeNeutral,
		ai_matched: badgeOk,
		needs_human_review: badgeWarn,
		human_assigned: badgeNeutral
	};
</script>

<svelte:head><title>Assessments | Configains CMS</title></svelte:head>
<div class={flow}>
	<h1>Coaching assessments</h1>
	<p class={help}>
		Review AI Coaching matches and override them. Any health answer sends a client here for personal
		review.
	</p>

	{#if form?.message}<p class={error} role="alert">{form.message}</p>{/if}
	{#if form?.updated}<p class={success} role="status">Saved.</p>{/if}
	{#if data.loadError}<p class={error} role="alert">{data.loadError}</p>{/if}

	{#if data.assessments.length === 0 && !data.loadError}
		<p>No assessments yet.</p>
	{/if}

	{#each data.assessments as row (row.id)}
		<section class="{card} {flow}">
			<header class="flex flex-wrap items-center justify-between gap-3">
				<h2 class="mb-0">{row.client?.display_name ?? 'Unnamed client'}</h2>
				<span class={statusBadge[row.status] ?? badgeNeutral}>
					{statusLabel[row.status] ?? row.status}
				</span>
			</header>
			<p class={help}>
				Submitted {new Date(row.created_at).toLocaleDateString('en-GB')} ·
				{row.client?.coaching_mode === 'human' ? 'Human coaching' : 'AI coaching'}
			</p>

			<dl class="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2">
				<dt class="font-semibold">Goal</dt>
				<dd>{label(goals, row.answers.goal)}</dd>
				<dt class="font-semibold">Experience</dt>
				<dd>{label(experienceLevels, row.answers.experience)}</dd>
				<dt class="font-semibold">Location</dt>
				<dd>{label(trainingLocations, row.answers.training_location)}</dd>
				<dt class="font-semibold">Days a week</dt>
				<dd>{row.answers.days_per_week}</dd>
			</dl>

			{#if row.red_flags.length > 0}
				<p class={error}>
					Health answers: {row.red_flags.join(', ')}. Review personally before any plan.
				</p>
			{/if}

			{#if row.recommendation}
				<div>
					<p><strong>AI explanation:</strong> {row.recommendation.explanation}</p>
					<p class={help}>Model: {row.recommendation.model}</p>
				</div>
			{/if}

			<div class="grid gap-5 border-t border-line pt-5">
				{#if row.client?.coaching_mode !== 'human'}
					<form method="POST" action="?/human" class="grid gap-2">
						<input type="hidden" name="client_id" value={row.client_id} />
						<input type="hidden" name="assessment_id" value={row.id} />
						<p class="font-semibold">Coaching mode</p>
						<p class={help}>
							Switches this client to human coaching: check-ins and messages open with Cash.
						</p>
						<button class={secondary}>Move to human coaching</button>
					</form>
				{/if}

				<form method="POST" action="?/assign" class="grid gap-2">
					<input type="hidden" name="client_id" value={row.client_id} />
					<p class="font-semibold">Assign program</p>
					<label>
						Workout
						<select name="workout_template_id" required>
							{#each data.workoutTemplates as template (template.id)}
								<option value={template.id}>{template.name}</option>
							{/each}
						</select>
					</label>
					<label>
						Nutrition (optional)
						<select name="nutrition_template_id">
							<option value="">None</option>
							{#each data.nutritionTemplates as template (template.id)}
								<option value={template.id}>{template.name}</option>
							{/each}
						</select>
					</label>
					<button class={primary}>Assign as coach</button>
				</form>
			</div>
		</section>
	{/each}
</div>

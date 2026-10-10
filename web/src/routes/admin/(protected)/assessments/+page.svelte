<script lang="ts">
	import { goals, experienceLevels, trainingLocations } from '$lib/coaching/options';
	import { card, error, help, primary, secondary, success } from '$lib/features/cms/styles';
	let { data, form } = $props();

	const label = (options: readonly { value: string; label: string }[], value: string) =>
		options.find((option) => option.value === value)?.label ?? value;
	const statusLabel: Record<string, string> = {
		submitted: 'Waiting for matching',
		ai_matched: 'AI Coaching plan',
		needs_human_review: 'Needs Cash review',
		human_assigned: 'Human coaching'
	};
</script>

<svelte:head><title>Assessments | Configains CMS</title></svelte:head>
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
	<section class={card}>
		<h2>{row.client?.display_name ?? 'Unnamed client'}</h2>
		<p class={help}>
			{statusLabel[row.status] ?? row.status} · {new Date(row.created_at).toLocaleDateString(
				'en-GB'
			)}
			{row.client?.coaching_mode === 'human' ? ' · Human coaching' : ''}
		</p>
		<ul>
			<li>Goal: {label(goals, row.answers.goal)}</li>
			<li>Experience: {label(experienceLevels, row.answers.experience)}</li>
			<li>Location: {label(trainingLocations, row.answers.training_location)}</li>
			<li>Days a week: {row.answers.days_per_week}</li>
		</ul>

		{#if row.red_flags.length > 0}
			<p class={error}>
				Health answers: {row.red_flags.join(', ')}. Review personally before any plan.
			</p>
		{/if}

		{#if row.recommendation}
			<p><strong>AI explanation:</strong> {row.recommendation.explanation}</p>
			<p class={help}>Model: {row.recommendation.model}</p>
		{/if}

		<div class="flex flex-wrap items-end gap-2">
			{#if row.client?.coaching_mode !== 'human'}
				<form method="POST" action="?/human">
					<input type="hidden" name="client_id" value={row.client_id} />
					<input type="hidden" name="assessment_id" value={row.id} />
					<button class={secondary}>Move to human coaching</button>
				</form>
			{/if}
		</div>

		<form method="POST" action="?/assign" class="mt-4 grid gap-2">
			<input type="hidden" name="client_id" value={row.client_id} />
			<label class="grid gap-1"
				>Assign a different workout
				<select name="workout_template_id" required>
					{#each data.workoutTemplates as template (template.id)}
						<option value={template.id}>{template.name}</option>
					{/each}
				</select>
			</label>
			<label class="grid gap-1"
				>Nutrition (optional)
				<select name="nutrition_template_id">
					<option value="">None</option>
					{#each data.nutritionTemplates as template (template.id)}
						<option value={template.id}>{template.name}</option>
					{/each}
				</select>
			</label>
			<button class={primary}>Assign as coach</button>
		</form>
	</section>
{/each}

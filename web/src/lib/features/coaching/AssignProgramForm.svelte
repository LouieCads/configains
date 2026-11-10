<script lang="ts">
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import { enhance } from '$app/forms';
	import type { Recommendation } from '$lib/coaching/matching';
	import { help, primary, requiredMark } from '$lib/features/cms/styles';

	type Option = { id: string; name: string };
	let {
		workouts,
		nutrition,
		recommended = { workoutId: null, nutritionId: null },
		selected,
		clientId,
		action = '?/assign',
		submitLabel = 'Assign program',
		allowCustomise = false,
		note = ''
	}: {
		workouts: Option[];
		nutrition: Option[];
		/** Best fit for the client's assessment; preselected and marked in the lists. */
		recommended?: Recommendation;
		/** Overrides the recommendation, e.g. the client's current program. */
		selected?: Partial<Recommendation>;
		clientId?: string;
		action?: string;
		submitLabel?: string;
		/** Offers "customise after assigning", which opens the client's private copy in the editor. */
		allowCustomise?: boolean;
		note?: string;
	} = $props();

	const firstOf = (options: Option[], ...ids: (string | null | undefined)[]) =>
		ids.find((id) => id && options.some((option) => option.id === id)) ?? null;

	// svelte-ignore state_referenced_locally
	let workoutId = $state(
		firstOf(workouts, selected?.workoutId, recommended.workoutId) ?? workouts[0]?.id ?? ''
	);
	// svelte-ignore state_referenced_locally
	let nutritionId = $state(
		firstOf(nutrition, selected?.nutritionId, recommended.nutritionId) ?? ''
	);
	let pending = $state(false);

	const label = (option: Option, recommendedId: string | null) =>
		option.id === recommendedId ? `${option.name} (recommended)` : option.name;
</script>

{#if workouts.length === 0}
	<p class="m-0 text-muted">
		No active workout templates. <a class="text-cyan-ink" href="/admin/templates/new?kind=workout"
			>Create one</a
		>.
	</p>
{:else}
	<form
		method="POST"
		{action}
		class="m-0! grid! gap-3!"
		use:enhance={() => {
			pending = true;
			return async ({ update }) => {
				await update({ reset: false });
				pending = false;
			};
		}}
	>
		{#if clientId}<input type="hidden" name="client_id" value={clientId} />{/if}
		<div class="grid grid-cols-2 gap-3 bp-640:grid-cols-1">
			<label class="m-0 grid gap-1 font-semibold"
				><span>Workout<span class={requiredMark} aria-hidden="true">*</span></span>
				<select name="workout_template_id" required bind:value={workoutId}>
					{#each workouts as option (option.id)}
						<option value={option.id}>{label(option, recommended.workoutId)}</option>
					{/each}
				</select>
			</label>
			<label class="m-0 grid gap-1 font-semibold"
				>Nutrition
				<select name="nutrition_template_id" bind:value={nutritionId}>
					<option value="">None</option>
					{#each nutrition as option (option.id)}
						<option value={option.id}>{label(option, recommended.nutritionId)}</option>
					{/each}
				</select>
			</label>
		</div>
		{#if allowCustomise}
			<label class="m-0 flex! items-center gap-2 font-normal!">
				<input type="checkbox" name="customise" value="1" class="w-auto!" />
				Customise after assigning
			</label>
		{/if}
		<div class="flex flex-wrap items-center gap-3">
			<button class={primary} disabled={pending}
				><UserPlus size={18} aria-hidden="true" />{pending ? 'Assigning…' : submitLabel}</button
			>
			{#if note}<p class="{help} m-0!">{note}</p>{/if}
		</div>
	</form>
{/if}

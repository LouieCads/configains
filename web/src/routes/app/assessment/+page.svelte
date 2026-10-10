<script lang="ts">
	import { enhance } from '$app/forms';
	import { experienceLevels, goals, trainingLocations, dayRange } from '$lib/coaching/options';
	import { clientSexOptions, healthFlags } from '$lib/coaching/assessment';
	import { card, error, help, primary } from '$lib/features/cms/styles';
	let { form } = $props();
	let busy = $state(false);
	const days = Array.from({ length: dayRange[1] - dayRange[0] + 1 }, (_, i) => dayRange[0] + i);
</script>

<svelte:head
	><title>Coaching assessment | Configains</title><meta
		name="robots"
		content="noindex, nofollow"
	/></svelte:head
>
<main class="mx-auto grid max-w-[640px] gap-6 p-6">
	<h1>Coaching assessment</h1>
	<p>
		Your answers choose from Cash's approved programs. Health answers mean Cash reviews your plan
		personally. Nothing here replaces medical advice.
	</p>

	<form
		method="POST"
		class="grid gap-6"
		use:enhance={() => {
			busy = true;
			return async ({ update }) => {
				await update();
				busy = false;
			};
		}}
	>
		{#if form?.message}<p class={error} role="alert">{form.message}</p>{/if}

		<fieldset class={card}>
			<legend>What is your main goal?</legend>
			{#each goals as goal (goal.value)}
				<label class="my-2 flex items-center gap-2">
					<input type="radio" name="goal" value={goal.value} required />
					{goal.label}
				</label>
			{/each}
		</fieldset>

		<fieldset class={card}>
			<legend>How would you describe your training experience?</legend>
			{#each experienceLevels as level (level.value)}
				<label class="my-2 flex items-center gap-2">
					<input type="radio" name="experience" value={level.value} required />
					{level.label}
				</label>
			{/each}
		</fieldset>

		<fieldset class={card}>
			<legend>Where will you train?</legend>
			{#each trainingLocations as location (location.value)}
				<label class="my-2 flex items-center gap-2">
					<input type="radio" name="training_location" value={location.value} required />
					{location.label}
				</label>
			{/each}
		</fieldset>

		<fieldset class={card}>
			<legend>How many days a week can you train?</legend>
			<select name="days_per_week" required>
				<option value="">Choose</option>
				{#each days as day (day)}
					<option value={day}>{day} days</option>
				{/each}
			</select>
		</fieldset>

		<fieldset class={card}>
			<legend>Which program variant fits you?</legend>
			<p class={help}>Used only to choose the approved program variant.</p>
			{#each clientSexOptions as option (option.value)}
				<label class="my-2 flex items-center gap-2">
					<input type="radio" name="sex" value={option.value} required />
					{option.label}
				</label>
			{/each}
		</fieldset>

		<fieldset class={card}>
			<legend>Do any of these apply to you?</legend>
			<p class={help}>Select all that apply. If none do, leave them unticked.</p>
			{#each healthFlags as flag (flag.value)}
				<label class="my-2 flex items-center gap-2">
					<input type="checkbox" name="health" value={flag.value} />
					{flag.label}
				</label>
			{/each}
		</fieldset>

		<button class={primary} disabled={busy}>{busy ? 'Saving…' : 'Submit answers'}</button>
	</form>
</main>

<script lang="ts">
	// The coach's calorie and macro targets for this client, and the reminders they left. The same card
	// is shown to the client on their home page and to the coach, so both see exactly the same thing.
	import Utensils from '@lucide/svelte/icons/utensils';
	import { macroCalories, type ClientTargets } from '$lib/coaching/targets';
	import { card } from '$lib/features/cms/styles';
	import { formatNumber } from './chart';
	import StatTile from './StatTile.svelte';

	let { targets }: { targets: ClientTargets } = $props();

	const macros = $derived(
		[
			{ label: 'Protein', value: targets.protein_g },
			{ label: 'Fat', value: targets.fat_g },
			{ label: 'Carbs', value: targets.carbs_g }
		].filter((macro): macro is { label: string; value: number } => macro.value !== null)
	);
	const hasFigures = $derived(targets.calories_kcal !== null || macros.length > 0);
	const fromMacros = $derived(macroCalories(targets));
</script>

<section class={card} aria-labelledby="nutrition-targets">
	<h2 id="nutrition-targets" class="m-0 mb-1 flex items-center gap-2 text-[1.5rem] font-bold">
		<Utensils size={22} aria-hidden="true" />Nutrition
	</h2>
	{#if hasFigures}
		<p class="mt-0 mb-4 text-[0.85rem] text-muted">
			Daily targets from your coach{fromMacros !== null && targets.calories_kcal === null
				? `, about ${formatNumber(fromMacros)} kcal from the macros`
				: ''}.
		</p>
		<div class="grid grid-cols-2 gap-3 min-[560px]:grid-cols-4">
			{#if targets.calories_kcal !== null}
				<StatTile label="Calories" value={formatNumber(targets.calories_kcal)} unit="kcal" />
			{/if}
			{#each macros as macro (macro.label)}
				<StatTile label={macro.label} value={formatNumber(macro.value)} unit="g" />
			{/each}
		</div>
	{/if}

	{#if targets.nutrition_notes.length > 0}
		<h3 class="mt-6 mb-2 text-[0.75rem] font-bold tracking-[1px] text-muted uppercase">
			Coach notes
		</h3>
		<ul class="m-0 grid list-disc gap-1.5 pl-5">
			{#each targets.nutrition_notes as note, index (index)}<li>{note}</li>{/each}
		</ul>
	{/if}
	<p class="mt-5 mb-0 text-[0.8rem] text-muted">
		General fitness and wellness guidance, not medical advice.
	</p>
</section>

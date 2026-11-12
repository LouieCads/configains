<script lang="ts">
	import Pencil from '@lucide/svelte/icons/pencil';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import X from '@lucide/svelte/icons/x';
	import { enhance } from '$app/forms';
	import ExerciseDemo from '$lib/features/coaching/ExerciseDemo.svelte';
	import LibraryExerciseForm from '$lib/features/coaching/LibraryExerciseForm.svelte';
	import {
		badgeNeutral,
		card,
		error,
		help,
		primary,
		secondary,
		subtle,
		subtleDanger,
		success
	} from '$lib/features/cms/styles';
	let { data, form } = $props();

	let adding = $state(false);
	let editing = $state<string | null>(null);
	let query = $state('');
	const visible = $derived(
		data.exercises.filter((exercise) =>
			exercise.name.toLowerCase().includes(query.trim().toLowerCase())
		)
	);
	const confirmDelete = (name: string, uses: number) => (event: SubmitEvent) => {
		const note =
			uses > 0
				? ` It is used in ${uses} program exercise${uses === 1 ? '' : 's'}; they keep their name but lose the demo.`
				: '';
		if (!confirm(`Delete ${name} from the library?${note}`)) event.preventDefault();
	};
</script>

<svelte:head><title>Exercise library | Configains CMS</title></svelte:head>
<div class="grid gap-6">
	<header class="mt-3 flex flex-wrap items-center justify-between gap-4">
		<div>
			<h1 class="m-0!">Exercise library</h1>
			<p class="{help} mb-0!">
				Add a demo once and every program with that exercise shows it to clients.
			</p>
		</div>
		{#if !data.localDemo}
			<button
				type="button"
				class={adding ? secondary : primary}
				aria-expanded={adding}
				aria-controls="add-exercise"
				onclick={() => (adding = !adding)}
				>{#if adding}<X size={18} aria-hidden="true" />Cancel{:else}<Plus
						size={18}
						aria-hidden="true"
					/>Add exercise{/if}</button
			>
		{/if}
	</header>

	{#if form?.saved}<p class="{success} m-0!" role="status">{form.saved} saved.</p>{/if}
	{#if form?.deleted}<p class="{success} m-0!" role="status">Exercise deleted.</p>{/if}
	{#if form?.message}<p class="{error} m-0!" role="alert">
			{form.message}
		</p>{/if}
	{#if data.loadError}<p class="{error} m-0!" role="alert">{data.loadError}</p>{/if}

	{#if data.localDemo}
		<p class="m-0 rounded-[10px] border border-dashed border-line p-6 text-center text-muted">
			The exercise library is not available in the local demo.
		</p>
	{:else}
		<section id="add-exercise" class={card} hidden={!adding}>
			<h2 class="text-[1.5rem]!">Add an exercise</h2>
			<LibraryExerciseForm onDone={() => (adding = false)} />
		</section>

		{#if data.exercises.length === 0 && !data.loadError}
			<p class="m-0 rounded-[10px] border border-dashed border-line p-6 text-center text-muted">
				No exercises yet. Add one with a YouTube link or a short clip.
			</p>
		{:else if data.exercises.length > 0}
			<label>
				<span class="sr-only">Search exercises</span>
				<input type="search" placeholder="Search by name" bind:value={query} />
			</label>
			<ul class="m-0 grid list-none gap-3 p-0">
				{#each visible as exercise (exercise.id)}
					<li class="rounded-[10px] border border-line bg-paper px-4 py-3">
						{#if editing === exercise.id}
							<LibraryExerciseForm entry={exercise} onDone={() => (editing = null)} />
						{:else}
							<div class="flex flex-wrap items-center gap-x-4 gap-y-2">
								<span class="grid min-w-0 flex-1 basis-48 gap-1">
									<strong class="truncate">{exercise.name}</strong>
									<span class="text-[0.8rem] text-muted"
										>{exercise.uses
											? `In ${exercise.uses} program exercise${exercise.uses === 1 ? '' : 's'}`
											: 'Not in any program yet'}</span
									>
								</span>
								{#if exercise.demo}
									<ExerciseDemo demo={exercise.demo} name={exercise.name} />
								{:else}
									<span class={badgeNeutral}>No demo</span>
								{/if}
								<button type="button" class={subtle} onclick={() => (editing = exercise.id)}
									><Pencil size={16} aria-hidden="true" />Edit<span class="sr-only">
										{exercise.name}</span
									></button
								>
								<form
									method="POST"
									action="?/delete"
									class="m-0"
									use:enhance
									onsubmit={confirmDelete(exercise.name, exercise.uses)}
								>
									<input type="hidden" name="id" value={exercise.id} />
									<button class={subtleDanger}
										><Trash2 size={16} aria-hidden="true" />Delete<span class="sr-only">
											{exercise.name}</span
										></button
									>
								</form>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
			{#if visible.length === 0}<p class="m-0 text-center text-muted">No exercises found.</p>{/if}
		{/if}
	{/if}
</div>

<script lang="ts">
	import PageHero from '$lib/components/sections/PageHero.svelte';
</script>

<svelte:head
	><title>Coaching | Configains</title><meta
		name="description"
		content="Explore Configains online fitness coaching."
	/></svelte:head
>
<PageHero
	eyebrow="Online coaching"
	title="A plan built around you."
	copy="Structure where you need it, flexibility where life demands it, and support throughout the process."
/>
<section class="mx-auto grid max-w-6xl gap-6 px-6 py-20 md:grid-cols-3">
	{#each ['Personal training plan', 'Nutrition guidance', 'Regular accountability'] as item (item)}<article
			class="rounded-2xl border border-black/10 bg-white p-7"
		>
			<h2 class="text-xl font-black">{item}</h2>
			<p class="mt-3 text-slate-600">
				Practical, personalized direction focused on sustainable progress.
			</p>
		</article>{/each}
</section>

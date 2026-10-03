<script lang="ts">
	import { resolve } from '$app/paths';
	import PageHero from '$lib/components/sections/PageHero.svelte';
</script>

<svelte:head
	><title>Coaching | Configains</title><meta
		name="description"
		content="Explore Configains online fitness coaching."
	/></svelte:head
>
<PageHero
	eyebrow="Configains coaching"
	title="A plan built around you."
	copy="Training, nutrition, and accountability with personal guidance from Cash Fuerte, the founder and coach behind Configains."
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
<section class="mx-auto max-w-6xl px-6 pb-20">
	<h2 class="text-3xl font-black">Start with your story.</h2>
	<p class="mt-4 max-w-2xl leading-8 text-slate-700">
		Complete a quick fitness and nutrition assessment. Cash Fuerte will personally review your
		answers and email you a recommended Configains program, plan, and duration.
	</p>
	<a
		class="coaching-cta mt-6 inline-block rounded-full bg-[#172019] px-7 py-4 font-bold text-white"
		href={resolve('/contact')}
	>
		Find your starting point →
	</a>
</section>

<style>
	.coaching-cta {
		color: white;
	}
</style>

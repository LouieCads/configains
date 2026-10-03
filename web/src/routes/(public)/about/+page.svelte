<script lang="ts">
	import { resolve } from '$app/paths';
	import PageHero from '$lib/components/sections/PageHero.svelte';
</script>

<svelte:head
	><title>About | Configains</title><meta
		name="description"
		content="Learn about the coaching philosophy behind Configains."
	/></svelte:head
>
<PageHero
	eyebrow="About Configains"
	title="Coaching for the long game."
	copy="Configains exists to make getting stronger feel clear, practical, and sustainable."
/>
<section class="mx-auto max-w-3xl px-6 py-20 text-lg leading-8 text-slate-700">
	<h2 class="text-3xl font-black text-[#172019]">No extremes required.</h2>
	<p class="mt-6">
		The best plan is one you can keep following. We combine progressive training, flexible
		nutrition, and direct support to help you build habits that hold up outside a perfect week.
	</p>
	<h2 class="mt-10 text-3xl font-black text-[#172019]">Meet Cash Fuerte, founder and coach.</h2>
	<p class="mt-6">
		Cash Fuerte founded Configains to bring practical training, nutrition, and personal guidance
		together. He reviews your assessment, recommends a program that fits your starting point, and
		supports you as your goals and routine evolve.
	</p>
	<a class="mt-8 inline-block font-bold underline" href={resolve('/contact')}
		>Find your starting point →</a
	>
</section>

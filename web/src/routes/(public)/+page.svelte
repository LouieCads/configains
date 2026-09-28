<script lang="ts">
	import { resolve } from '$app/paths';
	let { data } = $props();
</script>

<svelte:head>
	<title>Configains | Sustainable Online Fitness Coaching</title>
	<meta
		name="description"
		content="Practical online coaching for strength, confidence, and sustainable progress."
	/>
</svelte:head>

<section class="bg-[#172019] px-6 py-24 text-white sm:py-36">
	<div class="mx-auto max-w-6xl">
		<p class="mb-6 text-sm font-bold tracking-[0.25em] text-lime-300 uppercase">
			Online fitness coaching
		</p>
		<h1 class="max-w-5xl text-6xl leading-[0.95] font-black tracking-tight sm:text-8xl">
			Build strength that fits your life.
		</h1>
		<p class="mt-8 max-w-xl text-lg leading-8 text-white/70">
			Clear training, grounded nutrition, and honest accountability—without the all-or-nothing
			noise.
		</p>
		<a
			href={resolve('/contact')}
			class="mt-10 inline-block rounded-full bg-lime-300 px-7 py-4 font-black text-[#172019]"
			>Start your journey</a
		>
	</div>
</section>

<section class="px-6 py-20">
	<div class="mx-auto grid max-w-6xl gap-10 md:grid-cols-3">
		<div>
			<p class="text-sm font-black text-emerald-700">01</p>
			<h2 class="mt-3 text-2xl font-black">Train with purpose</h2>
			<p class="mt-3 text-slate-600">
				A focused plan designed around your goals, schedule, and equipment.
			</p>
		</div>
		<div>
			<p class="text-sm font-black text-emerald-700">02</p>
			<h2 class="mt-3 text-2xl font-black">Eat like a human</h2>
			<p class="mt-3 text-slate-600">
				Flexible guidance that supports results without taking over your life.
			</p>
		</div>
		<div>
			<p class="text-sm font-black text-emerald-700">03</p>
			<h2 class="mt-3 text-2xl font-black">Keep moving forward</h2>
			<p class="mt-3 text-slate-600">
				Consistent coaching and adjustments when real life changes the plan.
			</p>
		</div>
	</div>
</section>

{#if data.testimonials.length}
	<section class="bg-[#dfe9d8] px-6 py-20">
		<div class="mx-auto max-w-6xl">
			<h2 class="text-4xl font-black tracking-tight">Results that feel different.</h2>
			<div class="mt-10 grid gap-6 md:grid-cols-3">
				{#each data.testimonials as testimonial (testimonial.id)}
					<blockquote class="rounded-2xl bg-white p-7">
						<p class="text-lg leading-8">“{testimonial.quote}”</p>
						<footer class="mt-5 text-sm font-black">{testimonial.name}</footer>
					</blockquote>
				{/each}
			</div>
		</div>
	</section>
{/if}

<script lang="ts">
	let { eyebrow, title, copy }: { eyebrow: string; title: string; copy: string } = $props();
</script>

<section class="bg-[#dfe9d8] px-6 py-20 sm:py-28">
	<div class="mx-auto max-w-6xl">
		<p class="mb-5 text-sm font-black tracking-[0.2em] text-emerald-800 uppercase">{eyebrow}</p>
		<h1 class="max-w-4xl text-5xl font-black tracking-tight text-[#172019] sm:text-7xl">{title}</h1>
		<p class="mt-7 max-w-2xl text-lg leading-8 text-[#354139]">{copy}</p>
	</div>
</section>

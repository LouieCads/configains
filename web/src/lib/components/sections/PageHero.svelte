<script lang="ts">
	import { container, eyebrow } from '$lib/components/landing/styles';
	let { eyebrow: label, title, copy }: { eyebrow: string; title: string; copy: string } = $props();
</script>

<section class="{container} border-b border-b-line pt-[80px] pb-12 bp-850:pt-12 bp-850:pb-9">
	<p class={eyebrow}>{label}</p>
	<h1 class="max-w-[900px] text-[clamp(3rem,6vw,5.5rem)] whitespace-pre-line">{title}</h1>
	<p class="mt-6 max-w-[700px] whitespace-pre-line">{copy}</p>
</section>

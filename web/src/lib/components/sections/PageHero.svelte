<script lang="ts">
	import SectionLabel from '$lib/components/landing/SectionLabel.svelte';
	import { container } from '$lib/components/landing/styles';
	let { eyebrow: label, title, copy }: { eyebrow: string; title: string; copy: string } = $props();
</script>

<section
	class="{container} grid grid-cols-[minmax(0,7fr)_minmax(0,4fr)] items-end gap-x-[clamp(40px,6vw,96px)] gap-y-8 border-b border-b-ink/20 pt-[clamp(48px,7vw,104px)] pb-[clamp(40px,5vw,72px)] cq-58:grid-cols-[minmax(0,1fr)]"
>
	<div>
		<SectionLabel>{label}</SectionLabel>
		<h1 class="whitespace-pre-line">{title}</h1>
	</div>
	<p class="max-w-[28rem] text-[1.0625rem] whitespace-pre-line">{copy}</p>
</section>

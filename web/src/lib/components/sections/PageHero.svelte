<script lang="ts">
	let { eyebrow, title, copy }: { eyebrow: string; title: string; copy: string } = $props();
</script>

<section class="page-hero container">
	<p class="eyebrow">{eyebrow}</p>
	<h1 class="pre-line">{title}</h1>
	<p class="pre-line">{copy}</p>
</section>

<script lang="ts">
	let { data } = $props();
	const c = $derived(data.site.contact);
</script>

<section class="section page-copy container">
	<p class="eyebrow">{c.successEyebrow}</p>
	<h1>{c.successTitle}</h1>
	<p>{c.successCopy}</p>
	<a class="button" href="/">{c.back} →</a>
</section>

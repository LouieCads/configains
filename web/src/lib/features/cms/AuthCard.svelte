<script lang="ts">
	import type { Snippet } from 'svelte';
	import './cms.css';
	let { title, intro, children }: { title: string; intro: string; children: Snippet } = $props();
</script>

<svelte:head>
	<title>{title} | Configains</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>
<main class="cms cms-login">
	<section class="cms-auth-card">
		<a href="/" class="cms-brand">CONFIGAINS.</a>
		<p class="cms-eyebrow">CONTENT STUDIO</p>
		<h1>{title}</h1>
		<p>{intro}</p>
		{@render children()}
	</section>
</main>

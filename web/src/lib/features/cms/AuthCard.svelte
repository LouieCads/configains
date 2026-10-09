<!-- Shared layout for the sign-in and password-recovery pages. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { authCard, brand, eyebrow, loginPage, studio } from './styles';
	let { title, intro, children }: { title: string; intro: string; children: Snippet } = $props();
</script>

<svelte:head>
	<title>{title} | Configains</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>
<main class="{studio} {loginPage}">
	<section class={authCard}>
		<a href="/" class={brand}>CONFIGAINS.</a>
		<p class={eyebrow}>CONTENT STUDIO</p>
		<h1>{title}</h1>
		<p>{intro}</p>
		{@render children()}
	</section>
</main>

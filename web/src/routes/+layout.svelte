<script lang="ts">
	import '../app.css';
	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={data.site.brand.favicon || '/favicon.svg'} />
	<meta name="theme-color" content="#182a30" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Coustard&display=swap"
		rel="stylesheet"
	/>
</svelte:head>
{@render children()}

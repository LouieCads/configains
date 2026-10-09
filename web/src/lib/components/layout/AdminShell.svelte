<script lang="ts">
	import { page } from '$app/state';
	import { adminNavigation } from '$lib/constants/navigation';
	import TextDisplaySettings from '$lib/features/cms/TextDisplaySettings.svelte';
	import '$lib/features/cms/cms.css';
	let {
		children,
		email,
		localDemo = false
	}: { children: import('svelte').Snippet; email: string; localDemo?: boolean } = $props();
</script>

<div class="cms cms-shell">
	<aside class="cms-sidebar">
		<a href="/" class="cms-brand">CONFIGAINS.</a>
		<p class="cms-eyebrow">CONTENT STUDIO</p>
		<nav aria-label="Admin navigation">
			{#each adminNavigation as item (item.href)}<a
					class:active={page.url.pathname === item.href}
					href={item.href}>{item.label}</a
				>{/each}
		</nav>
		<a class="cms-secondary" href="/" target="_blank" rel="noopener">View website ↗</a>
		<TextDisplaySettings />
		<p class="editor-help">{email}</p>
		<form method="POST" action="/admin/logout">
			<button class="cms-secondary">Sign out</button>
		</form>
	</aside>
	<main class="cms-main">
		{#if localDemo}<p class="cms-success" role="status">
				Local demo: edits and publishing stay on this device.
			</p>{/if}{@render children()}
	</main>
</div>

<script lang="ts">
	import { navigating, page } from '$app/state';
	import { adminNavigation } from '$lib/constants/navigation';
	import { brand, secondaryOnDark, studio, success } from '$lib/features/cms/styles';
	import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import FilePenLine from '@lucide/svelte/icons/file-pen-line';
	import Images from '@lucide/svelte/icons/images';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import LayoutTemplate from '@lucide/svelte/icons/layout-template';
	import LogOut from '@lucide/svelte/icons/log-out';
	import MessageSquareQuote from '@lucide/svelte/icons/message-square-quote';
	import Users from '@lucide/svelte/icons/users';

	const icons: Record<string, typeof Users> = {
		'/admin/dashboard': LayoutDashboard,
		'/admin/content': FilePenLine,
		'/admin/testimonials': MessageSquareQuote,
		'/admin/transformations': Images,
		'/admin/clients': Users,
		'/admin/assessments': ClipboardCheck,
		'/admin/templates': LayoutTemplate
	};
	let {
		children,
		email,
		localDemo = false
	}: { children: import('svelte').Snippet; email: string; localDemo?: boolean } = $props();

	// Highlight the link being opened straight away instead of after its data arrives.
	const current = $derived(navigating.to?.url.pathname ?? page.url.pathname);
</script>

{#if navigating.to}<div
		class="nav-progress"
		role="progressbar"
		aria-label="Loading page"
	></div>{/if}

<div
	class="{studio} grid grid-cols-[250px_minmax(0,1fr)] bg-[#f7f8f5] bp-1100:grid-cols-[200px_minmax(0,1fr)] bp-760:grid-cols-1"
>
	<aside
		class="sticky top-0 flex h-screen flex-col [align-self:start] overflow-hidden bg-ink px-6 py-8 text-white bp-760:static bp-760:h-auto bp-760:p-5"
	>
		<a href="/" class={brand}>CONFIGAINS.</a>
		<nav class="mt-8 mb-6 grid gap-5 bp-760:my-4 bp-760:gap-2" aria-label="Admin navigation">
			{#each adminNavigation as group (group.heading)}
				<div class="grid gap-1 bp-760:flex bp-760:flex-wrap bp-760:items-center">
					{#if group.heading}<p
							class="m-0 px-3 text-[0.7rem] font-bold tracking-[1.5px] text-[#a9c7cd] uppercase bp-760:w-full"
						>
							{group.heading}
						</p>{/if}
					{#each group.items as item (item.href)}{@const Icon = icons[item.href]}<a
							class={[
								'flex items-center gap-3 rounded-[6px] px-3 py-2 hover:bg-[#2b444b] hover:text-cyan',
								current.startsWith(item.href) && 'bg-[#2b444b] text-cyan'
							]}
							aria-current={current.startsWith(item.href) ? 'page' : undefined}
							href={item.href}><Icon size={18} class="shrink-0" aria-hidden="true" />{item.label}</a
						>{/each}
				</div>
			{/each}
		</nav>
		<div class="mt-auto grid gap-3 bp-760:mt-0">
			<a class={secondaryOnDark} href="/" target="_blank" rel="noopener"
				><ExternalLink size={18} aria-hidden="true" />View website</a
			>
			<form method="POST" action="/admin/logout">
				<button class="{secondaryOnDark} w-full" title={email}
					><LogOut size={18} aria-hidden="true" />Sign out</button
				>
			</form>
		</div>
	</aside>
	<main class="min-w-0 p-10 bp-1100:p-7 bp-760:p-5">
		{#if localDemo}<p class={success} role="status">
				Local demo: edits and publishing stay on this device.
			</p>{/if}{@render children()}
	</main>
</div>

<style>
	.nav-progress {
		position: fixed;
		inset: 0 0 auto;
		z-index: 60;
		height: 3px;
		background: linear-gradient(90deg, transparent, var(--color-cyan), transparent) no-repeat;
		background-size: 40% 100%;
		animation: nav-progress 0.9s ease-in-out infinite;
		pointer-events: none;
	}
	@keyframes nav-progress {
		from {
			background-position: -60% 0;
		}
		to {
			background-position: 160% 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.nav-progress {
			animation: none;
			background: var(--color-cyan);
		}
	}
</style>

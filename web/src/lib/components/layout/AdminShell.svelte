<script lang="ts">
	import { page } from '$app/state';
	import { adminNavigation } from '$lib/constants/navigation';
	import { brand, help, secondaryOnDark, studio, success } from '$lib/features/cms/styles';
	let {
		children,
		email,
		localDemo = false
	}: { children: import('svelte').Snippet; email: string; localDemo?: boolean } = $props();
</script>

<div
	class="{studio} grid grid-cols-[250px_minmax(0,1fr)] bg-[#f7f8f5] bp-1100:grid-cols-[200px_minmax(0,1fr)] bp-760:grid-cols-1"
>
	<aside
		class="sticky top-0 h-screen [align-self:start] overflow-y-auto bg-ink px-6 py-8 text-white bp-760:static bp-760:h-auto bp-760:overflow-visible bp-760:p-5"
	>
		<a href="/" class={brand}>CONFIGAINS.</a>
		<p class="text-[0.7rem] font-bold tracking-[1.5px] text-[#a9c7cd]">CONTENT STUDIO</p>
		<nav class="my-8 grid gap-5 bp-760:my-4 bp-760:gap-2" aria-label="Admin navigation">
			{#each adminNavigation as group (group.heading)}
				<div class="grid gap-1 bp-760:flex bp-760:flex-wrap bp-760:items-center">
					{#if group.heading}<p
							class="m-0 px-3 text-[0.7rem] font-bold tracking-[1.5px] text-[#a9c7cd] uppercase bp-760:w-full"
						>
							{group.heading}
						</p>{/if}
					{#each group.items as item (item.href)}<a
							class={[
								'rounded-[6px] px-3 py-2 hover:bg-[#2b444b] hover:text-cyan',
								page.url.pathname.startsWith(item.href) && 'bg-[#2b444b] text-cyan'
							]}
							aria-current={page.url.pathname.startsWith(item.href) ? 'page' : undefined}
							href={item.href}>{item.label}</a
						>{/each}
				</div>
			{/each}
		</nav>
		<a class={secondaryOnDark} href="/" target="_blank" rel="noopener">View website ↗</a>
		<p class={help}>{email}</p>
		<form method="POST" action="/admin/logout">
			<button class={secondaryOnDark}>Sign out</button>
		</form>
	</aside>
	<main class="min-w-0 p-10 bp-1100:p-7 bp-760:p-5">
		{#if localDemo}<p class={success} role="status">
				Local demo: edits and publishing stay on this device.
			</p>{/if}{@render children()}
	</main>
</div>

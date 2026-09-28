<script lang="ts">
	import { resolve } from '$app/paths';
	import { adminNavigation } from '$lib/constants/navigation';

	let { children, email }: { children: import('svelte').Snippet; email: string } = $props();
</script>

<div class="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[16rem_1fr]">
	<aside class="bg-[#172019] p-6 text-white">
		<a href={resolve('/')} class="text-xl font-black">CONFIGAINS</a>
		<p class="mt-1 text-xs tracking-widest text-white/50 uppercase">Content studio</p>
		<nav class="mt-10 flex gap-2 overflow-x-auto lg:flex-col" aria-label="Admin navigation">
			{#each adminNavigation as item (item.href)}
				<a
					class="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/10"
					href={resolve(item.href)}>{item.label}</a
				>
			{/each}
		</nav>
		<div class="mt-8 border-t border-white/10 pt-5">
			<p class="truncate text-xs text-white/60">{email}</p>
			<form method="POST" action="/admin/logout" class="mt-3">
				<button class="text-sm font-semibold hover:underline">Sign out</button>
			</form>
		</div>
	</aside>
	<main class="p-6 lg:p-10">{@render children()}</main>
</div>

<script lang="ts">
	import { resolve } from '$app/paths';
	import { publicNavigation } from '$lib/constants/navigation';
</script>

<header class="border-b border-black/10 bg-[#f6f7f2]/95">
	<div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
		<a href={resolve('/')} class="text-xl font-black tracking-tight">CONFIGAINS</a>
		<nav aria-label="Main navigation" class="hidden gap-6 text-sm font-semibold md:flex">
			{#each publicNavigation as item (item.href)}
				<a class="transition hover:text-emerald-700" href={resolve(item.href)}>{item.label}</a>
			{/each}
		</nav>
		<a
			href={resolve('/contact')}
			class="header-cta rounded-full bg-[#172019] px-5 py-2.5 text-sm font-bold text-white"
			>Get started</a
		>
	</div>
</header>

<style>
	.header-cta {
		color: white;
	}
</style>

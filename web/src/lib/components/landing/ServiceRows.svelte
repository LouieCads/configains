<script lang="ts">
	import type { Content } from '$lib/content/schema';
	import ServiceIcon from './ServiceIcon.svelte';
	import { reveal } from './motion';
	import { cardCopy, mark } from './styles';
	let {
		services,
		headingTag = 'h3',
		wide = false
	}: { services: Content[]; headingTag?: 'h2' | 'h3'; wide?: boolean } = $props();
</script>

<ol class="m-0 list-none border-b border-b-ink/20 p-0">
	{#each services as service, index (index)}
		<li
			class={[
				'group grid gap-x-6 gap-y-3 border-t border-t-ink/20 py-9 cq-40:py-8',
				wide
					? 'grid-cols-[4rem_minmax(0,5fr)_minmax(0,6fr)] cq-58:grid-cols-[4rem_minmax(0,1fr)] cq-40:grid-cols-[minmax(0,1fr)]'
					: 'grid-cols-[4rem_minmax(0,1fr)] cq-40:grid-cols-[minmax(0,1fr)]'
			]}
			use:reveal={index * 70}
		>
			<span class="pt-[0.35rem] font-display text-[2rem]/none text-cyan-deep" aria-hidden="true"
				>{String(index + 1).padStart(2, '0')}</span
			>
			<svelte:element this={headingTag} class="text-[clamp(2.25rem,3.6vw,3rem)]"
				><span
					class="{mark} [--mark-size:0%_100%] [transition:background-size_0.55s_cubic-bezier(0.65,0,0.35,1)] group-hover:[--mark-size:100%_100%] motion-reduce:[transition:none]"
					>{service.title}</span
				></svelte:element
			>
			<div class={wide ? 'cq-58:col-start-2 cq-40:col-start-1' : 'col-start-2 cq-40:col-start-1'}>
				<p class="{cardCopy} mt-0 max-w-[34rem] text-[1rem]">{service.copy}</p>
				<p
					class="mt-5 inline-flex items-center gap-2.5 rounded-[3px] bg-mist px-3 py-2 text-[0.8125rem]/[1.4] text-ink"
				>
					<span class="text-cyan-deep"><ServiceIcon name={service.icon} size={20} /></span
					>{service.detail}
				</p>
			</div>
		</li>
	{/each}
</ol>

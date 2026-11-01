<script lang="ts">
	import { card, primary } from '$lib/features/cms/styles';
	let { data } = $props();

	const todo = $derived(
		[
			data.checkIns > 0 && {
				href: '/admin/clients',
				label: `${data.checkIns} check-in${data.checkIns === 1 ? '' : 's'} waiting for feedback`
			},
			data.assessments > 0 && {
				href: '/admin/assessments',
				label: `${data.assessments} assessment${data.assessments === 1 ? '' : 's'} need your review`
			}
		].filter((item) => !!item)
	);
	const shortcuts = $derived([
		{ href: '/admin/content', title: 'Website pages', note: 'Text, photos and page sections' },
		{ href: '/admin/testimonials', title: 'Testimonials', note: `${data.testimonials} total` },
		{
			href: '/admin/transformations',
			title: 'Transformations',
			note: `${data.transformations} total`
		},
		...(data.localDemo
			? []
			: [{ href: '/admin/clients', title: 'Clients', note: `${data.clients} total` }])
	]);
</script>

<svelte:head><title>Dashboard | Configains CMS</title></svelte:head>
<h1>Dashboard</h1>

<section class="{card} mb-6">
	<h2 class="text-[1.5rem]!">To do</h2>
	{#if todo.length === 0}
		<p class="m-0 text-muted">Nothing waiting. You're all caught up.</p>
	{:else}
		<ul class="m-0 grid list-none gap-2 p-0">
			{#each todo as item (item.href)}
				<li>
					<a
						class="flex items-center justify-between gap-3 rounded-lg border border-[#efb8ac] bg-[#fff1ee] p-3 font-semibold text-[#962f24] no-underline"
						href={item.href}>{item.label}<span aria-hidden="true">→</span></a
					>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<div class="mb-6 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
	{#each shortcuts as item (item.href)}
		<a
			class="grid gap-1 rounded-[10px] border border-line bg-paper p-5 text-ink no-underline hover:border-cyan-ink"
			href={item.href}
		>
			<strong class="text-[1.05rem]">{item.title}</strong>
			<span class="text-[0.85rem] text-muted">{item.note}</span>
		</a>
	{/each}
</div>

<a class={primary} href="/admin/content">Edit website →</a>

<script lang="ts">
	import { card, primary } from '$lib/features/cms/styles';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import FilePenLine from '@lucide/svelte/icons/file-pen-line';
	import FileText from '@lucide/svelte/icons/file-text';
	import Images from '@lucide/svelte/icons/images';
	import MessageSquareQuote from '@lucide/svelte/icons/message-square-quote';
	import Users from '@lucide/svelte/icons/users';
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
		{
			href: '/admin/content',
			title: 'Website pages',
			icon: FileText,
			note: 'Text, photos and page sections'
		},
		{
			href: '/admin/testimonials',
			title: 'Testimonials',
			icon: MessageSquareQuote,
			value: data.testimonials
		},
		{
			href: '/admin/transformations',
			title: 'Transformations',
			icon: Images,
			value: data.transformations
		},
		...(data.localDemo
			? []
			: [{ href: '/admin/clients', title: 'Clients', icon: Users, value: data.clients }])
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
						class="flex items-center justify-between gap-3 rounded-lg border border-current p-3 font-semibold text-[#962f24] no-underline hover:underline"
						href={item.href}>{item.label}<ChevronRight size={18} aria-hidden="true" /></a
					>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<div class="mb-6 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
	{#each shortcuts as item (item.href)}
		<a
			class="group grid gap-3 rounded-[10px] border border-line bg-paper p-5 text-ink no-underline shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-ink hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-ink"
			href={item.href}
		>
			<span class="flex items-center justify-between gap-3">
				<span class="flex items-center gap-2.5">
					<span
						class="grid size-9 place-items-center rounded-lg border border-current text-cyan-deep"
						aria-hidden="true"><item.icon size={20} /></span
					>
					<strong class="text-[1.1rem]">{item.title}</strong>
				</span>
				<ChevronRight
					size={20}
					class="text-cyan-ink transition-transform group-hover:translate-x-0.5"
					aria-hidden="true"
				/>
			</span>
			{#if item.value !== undefined}
				<span class="flex items-baseline gap-1.5">
					<span class="text-[2rem] leading-none font-bold text-ink">{item.value}</span>
					<span class="text-base font-medium text-muted">total</span>
				</span>
			{:else}
				<span class="text-base font-medium text-muted">{item.note}</span>
			{/if}
		</a>
	{/each}
</div>

<a class={primary} href="/admin/content"><FilePenLine size={18} aria-hidden="true" />Edit website</a
>

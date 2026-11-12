<script lang="ts">
	import { card, primary } from '$lib/features/cms/styles';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import FilePenLine from '@lucide/svelte/icons/file-pen-line';
	import FileText from '@lucide/svelte/icons/file-text';
	import Images from '@lucide/svelte/icons/images';
	import MessageSquareQuote from '@lucide/svelte/icons/message-square-quote';
	import Users from '@lucide/svelte/icons/users';
	import CalendarClock from '@lucide/svelte/icons/calendar-clock';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import Mail from '@lucide/svelte/icons/mail';
	import MessageSquare from '@lucide/svelte/icons/message-square';
	let { data } = $props();

	const groups = $derived(
		[
			{
				key: 'assessments',
				title: 'Assessments to review',
				icon: ClipboardList,
				items: data.tasks.assessments
			},
			{
				key: 'checkIns',
				title: 'Check-ins waiting for feedback',
				icon: MessageSquare,
				items: data.tasks.checkIns
			},
			{ key: 'messages', title: 'New client messages', icon: Mail, items: data.tasks.messages },
			{
				key: 'phases',
				title: 'Program or phase updates due',
				icon: CalendarClock,
				items: data.tasks.phases
			}
		].filter((group) => group.items.length > 0)
	);
	const waiting = $derived(groups.reduce((total, group) => total + group.items.length, 0));
	const when = (value: string) =>
		new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

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

<section class="{card} mb-6" aria-labelledby="todo-title">
	<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
		<h2 id="todo-title" class="m-0! text-[1.5rem]!">Today</h2>
		{#if waiting > 0}<span class="text-[0.9rem] text-muted"
				>{waiting} item{waiting === 1 ? '' : 's'} waiting</span
			>{/if}
	</div>
	{#if data.localDemo}
		<p class="m-0 text-muted">Coaching tasks are not available in the local demo.</p>
	{:else if groups.length === 0}
		<p class="m-0 text-muted">Nothing waiting. You're all caught up.</p>
	{:else}
		<div class="grid gap-6 min-[900px]:grid-cols-2">
			{#each groups as group (group.key)}
				<section aria-labelledby="todo-{group.key}">
					<h3
						id="todo-{group.key}"
						class="mb-2 flex items-center gap-2 text-[0.8rem] font-bold tracking-[1px] text-muted uppercase"
					>
						<group.icon size={16} aria-hidden="true" />{group.title}
						<span class="font-normal">({group.items.length})</span>
					</h3>
					<ul class="m-0 grid list-none gap-2 p-0">
						{#each group.items as item, index (`${item.clientId}-${index}`)}
							<li>
								<a
									class="flex items-center gap-3 rounded-lg border border-line p-3 text-ink no-underline hover:border-cyan-ink"
									href={item.href}
								>
									<span class="grid min-w-0 flex-1 gap-0.5">
										<strong class="truncate text-[0.95rem]">{item.clientName}</strong>
										<span class="truncate text-[0.85rem] text-muted">{item.detail}</span>
									</span>
									{#if group.key !== 'phases'}<span class="shrink-0 text-[0.8rem] text-muted"
											>{when(item.at)}</span
										>{/if}
									<ChevronRight size={18} class="shrink-0 text-cyan-ink" aria-hidden="true" />
								</a>
							</li>
						{/each}
					</ul>
				</section>
			{/each}
		</div>
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

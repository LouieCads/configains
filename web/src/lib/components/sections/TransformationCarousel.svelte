<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import type { Transformation } from '$lib/types/cms';
	import type { Content } from '$lib/content/schema';
	import { cardCopy } from '$lib/components/landing/styles';

	let {
		items,
		proof,
		showStory = false,
		header
	}: {
		items: Transformation[];
		proof: Content;
		showStory?: boolean;
		/** Section heading rendered above the slides. */
		header?: Snippet;
	} = $props();
	const control =
		'grid size-12 cursor-pointer place-items-center rounded-[3px] border border-ink/40 bg-transparent text-ink [transition:background-color_0.2s,color_0.2s] hover:bg-ink hover:text-cyan focus-visible:outline-3 focus-visible:outline-cyan-ink focus-visible:outline-offset-[3px] disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink';
	let track = $state<HTMLDivElement>();
	let current = $state(0);
	let lastVisible = $state(0);
	let atStart = $state(true);
	let atEnd = $state(true);
	const slides = $derived(
		items.length
			? items
			: proof.placeholderTitles.map((title: string, index: number) => ({
					id: `placeholder-${index}`,
					title,
					summary: proof.placeholderCopy,
					before_image_url: '',
					after_image_url: '',
					before_image_alt: '',
					after_image_alt: '',
					story: ''
				}))
	);

	function sync() {
		if (!track) return;
		atStart = track.scrollLeft <= 2;
		atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
		const children = [...track.children] as HTMLElement[];
		const left = track.getBoundingClientRect().left;
		current = children.reduce(
			(best, child, index) =>
				Math.abs(child.getBoundingClientRect().left - left) <
				Math.abs(children[best].getBoundingClientRect().left - left)
					? index
					: best,
			0
		);
		lastVisible = Math.max(
			current,
			children.findLastIndex(
				(child) => child.getBoundingClientRect().left < left + track!.clientWidth - 2
			)
		);
	}
	function go(direction: number) {
		if (!track) return;
		const first = track.children[0] as HTMLElement | undefined;
		const second = track.children[1] as HTMLElement | undefined;
		const distance = second && first ? second.offsetLeft - first.offsetLeft : track.clientWidth;
		track.scrollBy({
			left: direction * distance,
			behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
		});
	}
	onMount(() => {
		const observer = new ResizeObserver(sync);
		if (track) observer.observe(track);
		window.addEventListener('resize', sync);
		sync();
		return () => {
			observer.disconnect();
			window.removeEventListener('resize', sync);
		};
	});
	$effect(() => {
		if (!track || !slides.length) return;
		const frame = requestAnimationFrame(sync);
		return () => cancelAnimationFrame(frame);
	});
</script>

<div
	class="@container min-w-0"
	role="region"
	aria-roledescription="carousel"
	aria-label="Client transformations"
>
	{@render header?.()}
	<!-- svelte-ignore a11y_no_noninteractive_tabindex (The scrolling area needs keyboard focus for native arrow-key scrolling.) -->
	<div
		class="transformation-track flex snap-x snap-mandatory [scrollbar-width:none] gap-6 overflow-x-auto pb-2 focus-visible:outline-3 focus-visible:outline-offset-[3px] focus-visible:outline-cyan-ink [&::-webkit-scrollbar]:hidden"
		bind:this={track}
		onscroll={sync}
		tabindex="0"
		aria-label="Before and after stories. Use the arrows to see more."
	>
		{#each slides as item, index (item.id)}
			<article
				class="group min-w-0 flex-[0_0_100%] snap-start @min-[620px]:basis-[calc((100%-24px)/2)] @min-[1000px]:basis-[calc((100%-48px)/3)]"
				role="group"
				aria-roledescription="slide"
				aria-label={`${index + 1} of ${slides.length}: ${item.title}`}
			>
				<div class="grid grid-cols-[1fr_1fr] gap-[3px] overflow-hidden rounded-[3px]">
					{#each [{ label: proof.before, src: item.before_image_url, alt: item.before_image_alt }, { label: proof.after, src: item.after_image_url, alt: item.after_image_alt }] as photo, side (side)}
						<div
							class={[
								'relative grid aspect-[3/4] place-items-center overflow-hidden',
								side === 1 ? 'bg-mist' : 'bg-bone-deep'
							]}
						>
							{#if photo.src}<img
									class="absolute inset-0 size-full object-cover [transition:transform_0.8s_cubic-bezier(0.22,1,0.36,1)] group-hover:[transform:scale(1.04)] motion-reduce:group-hover:[transform:none]"
									src={photo.src}
									alt={photo.alt || `${item.title}: ${photo.label}`}
									loading="lazy"
								/>
							{:else}<span
									class="flex flex-col items-center justify-center gap-[10px] px-4 text-center text-[0.8125rem]/[1.5] text-ink-soft"
									>{proof.photoPlaceholder}</span
								>{/if}
							<span
								class={[
									'absolute bottom-0 left-0 px-3 pt-[0.4rem] pb-[0.3rem] font-display text-[0.9375rem]/none tracking-[0.18em]',
									side === 1 ? 'bg-cyan text-ink' : 'bg-night text-bone'
								]}>{photo.label}</span
							>
						</div>
					{/each}
				</div>
				{#if !items.length}<div
						class="mt-5 flex items-center justify-between gap-3 font-display text-[0.9375rem]/none tracking-[0.18em] text-ink-soft"
					>
						<span>{proof.journey} {index + 1}</span><span
							class="rounded-[3px] border border-ink/25 px-2 pt-1 pb-0.5 text-[0.8125rem]"
							>{proof.comingSoon}</span
						>
					</div>{/if}
				<h3 class="mt-5">{item.title}</h3>
				{#if item.summary}<p class={cardCopy}>
						{item.summary}
					</p>{/if}
				{#if showStory && item.story}<p class="{cardCopy} whitespace-pre-line">
						{item.story}
					</p>{/if}
			</article>
		{/each}
	</div>
	{#if slides.length > 1 && !(atStart && atEnd)}
		<div class="mt-8 flex items-center gap-6">
			<div class="relative h-[2px] flex-1 bg-ink/15" aria-hidden="true">
				<span
					class="absolute inset-y-0 bg-ink [transition:left_0.4s,width_0.4s] motion-reduce:[transition:none]"
					style:left={`${(current / slides.length) * 100}%`}
					style:width={`${((lastVisible - current + 1) / slides.length) * 100}%`}
				></span>
			</div>
			<div class="flex gap-2">
				<button
					class={control}
					type="button"
					aria-label="Previous transformation"
					disabled={atStart}
					onclick={() => go(-1)}
					><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"
						><path
							d="M20 12H5m6-6-6 6 6 6"
							stroke="currentColor"
							stroke-width="1.8"
							stroke-linecap="square"
						/></svg
					></button
				><button
					class={control}
					type="button"
					aria-label="Next transformation"
					disabled={atEnd}
					onclick={() => go(1)}
					><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"
						><path
							d="M4 12h15m-6-6 6 6-6 6"
							stroke="currentColor"
							stroke-width="1.8"
							stroke-linecap="square"
						/></svg
					></button
				>
			</div>
		</div>
	{/if}
</div>

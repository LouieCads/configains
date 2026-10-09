<script lang="ts">
	import { onMount } from 'svelte';
	import type { Transformation } from '$lib/types/cms';
	import type { Content } from '$lib/content/schema';
	import { cardCopy, comingSoon, storyMeta } from '$lib/components/landing/styles';

	let {
		items,
		proof,
		showStory = false
	}: {
		items: Transformation[];
		proof: Content;
		showStory?: boolean;
	} = $props();
	const control =
		'size-11 cursor-pointer rounded-[50%] border border-[#9aafb0] bg-transparent text-[22px] text-inherit focus-visible:outline-3 focus-visible:outline-cyan-ink focus-visible:outline-offset-[3px] disabled:cursor-default disabled:opacity-35';
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
		sync();
		return () => observer.disconnect();
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
	<!-- svelte-ignore a11y_no_noninteractive_tabindex (The scrolling area needs keyboard focus for native arrow-key scrolling.) -->
	<div
		class="flex snap-x snap-mandatory [scrollbar-width:thin] gap-6 overflow-x-auto pb-4 focus-visible:outline-3 focus-visible:outline-offset-[3px] focus-visible:outline-cyan-ink"
		bind:this={track}
		onscroll={sync}
		tabindex="0"
		aria-label="Before and after stories. Scroll to see more."
	>
		{#each slides as item, index (item.id)}
			<article
				class="group min-w-0 flex-[0_0_100%] snap-start @min-[620px]:basis-[calc((100%-24px)/2)] @min-[1000px]:basis-[calc((100%-48px)/3)]"
				role="group"
				aria-roledescription="slide"
				aria-label={`${index + 1} of ${slides.length}: ${item.title}`}
			>
				<div class="grid grid-cols-[1fr_1fr] gap-[3px] overflow-hidden rounded-[10px]">
					{#each [{ label: proof.before, src: item.before_image_url, alt: item.before_image_alt }, { label: proof.after, src: item.after_image_url, alt: item.after_image_alt }] as photo, side (side)}
						<div
							class={[
								'relative grid h-[270px] place-items-center overflow-hidden bp-850:h-[240px]',
								side === 1 ? 'bg-[#dfebe7]' : 'bg-[#e6ede7]'
							]}
						>
							{#if photo.src}<img
									class="absolute inset-0 size-full object-cover [transition:transform_0.7s] group-hover:[transform:scale(1.035)] motion-reduce:group-hover:[transform:none]"
									src={photo.src}
									alt={photo.alt || `${item.title}: ${photo.label}`}
									loading="lazy"
								/>
							{:else}<span
									class="flex flex-col items-center justify-center gap-[10px] text-[#7c9890]"
									>{proof.photoPlaceholder}</span
								>{/if}
							<span
								class="absolute bottom-[13px] left-[13px] rounded-[4px] bg-[#f8faf8e6] px-[9px] py-[7px] font-[Arial] text-[0.625rem] leading-[normal] tracking-[1px] text-[#536762] bp-850:bottom-2 bp-850:left-2 bp-640:bottom-[13px] bp-640:left-[13px]"
								>{photo.label}</span
							>
						</div>
					{/each}
				</div>
				{#if !items.length}<div class={storyMeta}>
						<span>{proof.journey} {index + 1}</span><span class={comingSoon}
							>{proof.comingSoon}</span
						>
					</div>{/if}
				<h3 class="mt-[17px]">{item.title}</h3>
				{#if item.summary}<p class={cardCopy}>{item.summary}</p>{/if}
				{#if showStory && item.story}<p class="{cardCopy} whitespace-pre-line">{item.story}</p>{/if}
			</article>
		{/each}
	</div>
	{#if slides.length > 1 && !(atStart && atEnd)}
		<div class="mt-3 flex items-center justify-end gap-4">
			<button
				class={control}
				type="button"
				aria-label="Previous transformation"
				disabled={atStart}
				onclick={() => go(-1)}>←</button
			>
			<span class="font-arial text-[14px] leading-[normal]" aria-live="polite"
				>{current + 1}{#if lastVisible > current}–{lastVisible + 1}{/if} / {slides.length}</span
			>
			<button
				class={control}
				type="button"
				aria-label="Next transformation"
				disabled={atEnd}
				onclick={() => go(1)}>→</button
			>
		</div>
	{/if}
</div>

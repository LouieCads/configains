<script lang="ts">
	import { onMount } from 'svelte';
	import type { Transformation } from '$lib/types/cms';
	import type { Content } from '$lib/content/schema';

	let {
		items,
		proof,
		showStory = false
	}: {
		items: Transformation[];
		proof: Content;
		showStory?: boolean;
	} = $props();
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
	class="transformation-carousel"
	role="region"
	aria-roledescription="carousel"
	aria-label="Client transformations"
>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex (The scrolling area needs keyboard focus for native arrow-key scrolling.) -->
	<div
		class="transformation-track"
		bind:this={track}
		onscroll={sync}
		tabindex="0"
		aria-label="Before and after stories. Scroll to see more."
	>
		{#each slides as item, index (item.id)}
			<article
				class="transformation-card"
				role="group"
				aria-roledescription="slide"
				aria-label={`${index + 1} of ${slides.length}: ${item.title}`}
			>
				<div class="comparison">
					{#each [{ label: proof.before, src: item.before_image_url, alt: item.before_image_alt }, { label: proof.after, src: item.after_image_url, alt: item.after_image_alt }] as photo, side (side)}
						<div class="comparison-photo" class:after={side === 1}>
							{#if photo.src}<img
									src={photo.src}
									alt={photo.alt || `${item.title}: ${photo.label}`}
									loading="lazy"
								/>
							{:else}<span class="image-placeholder">{proof.photoPlaceholder}</span>{/if}
							<span class="image-label">{photo.label}</span>
						</div>
					{/each}
				</div>
				{#if !items.length}<div class="story-meta">
						<span>{proof.journey} {index + 1}</span><span class="coming-soon"
							>{proof.comingSoon}</span
						>
					</div>{/if}
				<h3>{item.title}</h3>
				{#if item.summary}<p>{item.summary}</p>{/if}
				{#if showStory && item.story}<p class="pre-line">{item.story}</p>{/if}
			</article>
		{/each}
	</div>
	{#if slides.length > 1 && !(atStart && atEnd)}
		<div class="carousel-controls">
			<button
				type="button"
				aria-label="Previous transformation"
				disabled={atStart}
				onclick={() => go(-1)}>←</button
			>
			<span aria-live="polite"
				>{current + 1}{#if lastVisible > current}–{lastVisible + 1}{/if} / {slides.length}</span
			>
			<button type="button" aria-label="Next transformation" disabled={atEnd} onclick={() => go(1)}
				>→</button
			>
		</div>
	{/if}
</div>

<style>
	.transformation-carousel {
		min-width: 0;
		container-type: inline-size;
	}
	.transformation-track {
		display: flex;
		gap: 24px;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		scrollbar-width: thin;
		padding-bottom: 16px;
	}
	.transformation-track > article {
		flex: 0 0 100%;
		min-width: 0;
		scroll-snap-align: start;
	}
	@container (min-width: 620px) {
		.transformation-track > article {
			flex-basis: calc((100% - 24px) / 2);
		}
	}
	@container (min-width: 1000px) {
		.transformation-track > article {
			flex-basis: calc((100% - 48px) / 3);
		}
	}
	.carousel-controls {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 16px;
		margin-top: 12px;
	}
	.carousel-controls button {
		width: 44px;
		height: 44px;
		border: 1px solid #9aafb0;
		border-radius: 50%;
		background: transparent;
		color: inherit;
		cursor: pointer;
		font-size: 22px;
	}
	.carousel-controls button:disabled {
		opacity: 0.35;
		cursor: default;
	}
	.carousel-controls button:focus-visible,
	.transformation-track:focus-visible {
		outline: 3px solid #157f90;
		outline-offset: 3px;
	}
	.carousel-controls span {
		font:
			14px Arial,
			sans-serif;
	}
</style>

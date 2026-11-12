<script lang="ts">
	import CirclePlay from '@lucide/svelte/icons/circle-play';
	import X from '@lucide/svelte/icons/x';
	import { youtubeEmbedUrl, youtubeThumbnail, type ExerciseDemo } from '$lib/coaching/demo';

	/**
	 * Exercise demonstration. With a mouse, hovering shows a small looping preview; a click or a
	 * tap opens the full demonstration in a dialog, so the client never leaves Configains.
	 * Nothing is fetched from YouTube until the preview or the dialog is shown.
	 */
	let { demo, name }: { demo: ExerciseDemo; name: string } = $props();

	let dialog = $state<HTMLDialogElement>();
	let open = $state(false);
	let previewing = $state(false);
	const canHover = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

	function show() {
		previewing = false;
		open = true;
		dialog?.showModal();
	}
	function close() {
		dialog?.close();
	}
</script>

<span
	class="relative inline-flex"
	role="presentation"
	onmouseenter={() => (previewing = canHover())}
	onmouseleave={() => (previewing = false)}
>
	<button
		type="button"
		class="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border border-[#b7c6c7] bg-transparent px-3 py-1 text-[0.8rem] font-semibold text-cyan-ink"
		aria-haspopup="dialog"
		onclick={show}
		><CirclePlay size={16} aria-hidden="true" />Demo<span class="sr-only"> for {name}</span></button
	>
	{#if previewing && !open}
		<span
			class="pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-0 z-20 block w-60 overflow-hidden rounded-lg border border-line bg-ink shadow-lg"
			aria-hidden="true"
		>
			{#if demo.mediaUrl && demo.mediaKind === 'video'}
				<video
					class="block aspect-video w-full object-cover"
					src={demo.mediaUrl}
					autoplay
					muted
					loop
					playsinline
				></video>
			{:else if demo.mediaUrl}
				<img class="block aspect-video w-full object-cover" src={demo.mediaUrl} alt="" />
			{:else if demo.youtubeId}
				<span class="relative block">
					<img
						class="block aspect-video w-full object-cover"
						src={youtubeThumbnail(demo.youtubeId)}
						alt=""
					/>
					<span class="absolute inset-0 grid place-items-center text-white"
						><CirclePlay size={40} /></span
					>
				</span>
			{/if}
		</span>
	{/if}
</span>

<dialog
	bind:this={dialog}
	class="m-auto w-[min(48rem,calc(100vw-2rem))] rounded-xl border-0 bg-paper p-0 backdrop:bg-black/70"
	aria-label="{name} demonstration"
	onclose={() => (open = false)}
	onclick={(event) => {
		if (event.target === dialog) close();
	}}
>
	<div class="flex items-center justify-between gap-3 px-4 py-2">
		<strong class="truncate">{name}</strong>
		<button
			type="button"
			class="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-ink"
			aria-label="Close"
			onclick={close}><X size={20} aria-hidden="true" /></button
		>
	</div>
	{#if open}
		<!-- An uploaded clip is shown first; it loads faster and loops like a GIF. -->
		{#if demo.mediaUrl && demo.mediaKind === 'video'}
			<video
				class="block max-h-[75vh] w-full bg-black"
				src={demo.mediaUrl}
				autoplay
				muted
				loop
				playsinline
				controls
			></video>
		{:else if demo.mediaUrl}
			<img
				class="block max-h-[75vh] w-full bg-black object-contain"
				src={demo.mediaUrl}
				alt="{name} demonstration"
			/>
		{/if}
		{#if demo.youtubeId}
			<iframe
				class={['block aspect-video w-full border-0', demo.mediaUrl && 'mt-2']}
				src={youtubeEmbedUrl(demo.youtubeId, !demo.mediaUrl)}
				title="{name} video"
				allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
				allowfullscreen
				referrerpolicy="strict-origin-when-cross-origin"
			></iframe>
		{/if}
	{/if}
</dialog>

<!--
	Modal cropper shown before an image upload. The admin drags a selection
	(free or locked to the field's recommended shape); `apply` renders it to a
	WebP file and passes it to `onApply`. The original file never leaves the browser.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { ImageGuide } from '$lib/content/image-guides';
	import { MAX_IMAGE_BYTES, IMAGE_SIZE_LABEL } from '$lib/content/uploads';

	/** Selection in fractions (0–1) of the source image's width and height. */
	type Crop = { x: number; y: number; width: number; height: number };
	/** Corner being dragged: north/south + west/east. */
	type Handle = 'nw' | 'ne' | 'sw' | 'se';
	type Interaction = {
		pointerId: number;
		mode: 'create' | 'move' | 'resize';
		start: { x: number; y: number };
		crop: Crop;
		handle?: Handle;
	};

	let {
		file,
		guide,
		onApply,
		onCancel
	}: {
		file: File;
		guide: ImageGuide;
		onApply: (file: File) => void;
		onCancel: () => void;
	} = $props();
	let stage = $state<HTMLDivElement>();
	let picture = $state<HTMLImageElement>();
	let sourceUrl = $state('');
	let crop = $state<Crop>({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 });
	let shape = $state<'free' | 'website'>('free');
	let working = $state(false);
	let error = $state('');
	let interaction: Interaction | null = null;
	const stageWidth = $derived(
		picture ? Math.round(Math.min(560, (430 * picture.naturalWidth) / picture.naturalHeight)) : 480
	);
	const selectedWidth = $derived(picture ? Math.round(crop.width * picture.naturalWidth) : 0);
	const selectedHeight = $derived(picture ? Math.round(crop.height * picture.naturalHeight) : 0);
	/** Longest edge of a free-crop upload, in pixels. */
	const MAX_OUTPUT_EDGE = 1600;
	/** Smallest selection edge, as a fraction of the image. */
	const MIN_SELECTION = 0.06;
	const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

	onMount(() => {
		const url = URL.createObjectURL(file);
		sourceUrl = url;
		const image = new Image();
		image.onload = () => (picture = image);
		image.onerror = () => (error = 'This image could not be opened. Choose another file.');
		image.src = url;
		return () => URL.revokeObjectURL(url);
	});

	/** Pointer position as fractions of the stage. */
	function point(event: PointerEvent) {
		const rect = stage!.getBoundingClientRect();
		return {
			x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
			y: clamp((event.clientY - rect.top) / rect.height, 0, 1)
		};
	}

	/**
	 * Crop spanning from a fixed `anchor` corner towards `current`, growing in the
	 * direction of `signX`/`signY`. In website shape the aspect ratio is locked and
	 * the box shrinks to stay inside the image.
	 */
	function rectangle(
		anchor: { x: number; y: number },
		current: { x: number; y: number },
		signX: number,
		signY: number
	): Crop {
		const maxWidth = signX > 0 ? 1 - anchor.x : anchor.x;
		const maxHeight = signY > 0 ? 1 - anchor.y : anchor.y;
		let width = clamp(Math.abs(current.x - anchor.x), Math.min(MIN_SELECTION, maxWidth), maxWidth);
		let height = clamp(
			Math.abs(current.y - anchor.y),
			Math.min(MIN_SELECTION, maxHeight),
			maxHeight
		);
		if (shape === 'website' && picture) {
			const ratio = (guide.width / guide.height) * (picture.naturalHeight / picture.naturalWidth);
			if (width / ratio > height) height = width / ratio;
			else width = height * ratio;
			const fit = Math.min(1, maxWidth / width, maxHeight / height);
			width *= fit;
			height *= fit;
		}
		return {
			x: signX > 0 ? anchor.x : anchor.x - width,
			y: signY > 0 ? anchor.y : anchor.y - height,
			width,
			height
		};
	}

	/** Begins creating, moving, or resizing depending on where the pointer lands. */
	function start(event: PointerEvent) {
		if (!picture || working || event.button !== 0) return;
		const target = event.target as HTMLElement;
		const handle = target.closest<HTMLElement>('[data-handle]')?.dataset.handle as
			Handle | undefined;
		const mode = handle ? 'resize' : target.closest('.crop-selection') ? 'move' : 'create';
		const startPoint = point(event);
		interaction = {
			pointerId: event.pointerId,
			mode,
			start: startPoint,
			crop: { ...crop },
			handle
		};
		if (mode === 'create') crop = rectangle(startPoint, startPoint, 1, 1);
		stage!.setPointerCapture(event.pointerId);
		event.preventDefault();
	}

	function move(event: PointerEvent) {
		if (!interaction || interaction.pointerId !== event.pointerId) return;
		const current = point(event);
		const { mode, start: startPoint, crop: initial, handle } = interaction;
		if (mode === 'move') {
			crop = {
				...initial,
				x: clamp(initial.x + current.x - startPoint.x, 0, 1 - initial.width),
				y: clamp(initial.y + current.y - startPoint.y, 0, 1 - initial.height)
			};
			return;
		}
		if (mode === 'create') {
			crop = rectangle(
				startPoint,
				current,
				current.x >= startPoint.x ? 1 : -1,
				current.y >= startPoint.y ? 1 : -1
			);
			return;
		}
		const signX = handle!.endsWith('e') ? 1 : -1;
		const signY = handle!.startsWith('s') ? 1 : -1;
		const anchor = {
			x: signX > 0 ? initial.x : initial.x + initial.width,
			y: signY > 0 ? initial.y : initial.y + initial.height
		};
		crop = rectangle(anchor, current, signX, signY);
	}

	function stop(event: PointerEvent) {
		if (interaction?.pointerId === event.pointerId) interaction = null;
	}

	/** Arrow keys nudge the selection; Shift moves it further. */
	function keyboard(event: KeyboardEvent) {
		const step = event.shiftKey ? 0.05 : 0.01;
		let x = crop.x;
		let y = crop.y;
		if (event.key === 'ArrowLeft') x -= step;
		else if (event.key === 'ArrowRight') x += step;
		else if (event.key === 'ArrowUp') y -= step;
		else if (event.key === 'ArrowDown') y += step;
		else return;
		crop = { ...crop, x: clamp(x, 0, 1 - crop.width), y: clamp(y, 0, 1 - crop.height) };
		event.preventDefault();
	}

	/** Switching to website shape recentres an aspect-locked selection. */
	function chooseShape(next: 'free' | 'website') {
		shape = next;
		if (next === 'free' || !picture) return;
		const ratio = (guide.width / guide.height) * (picture.naturalHeight / picture.naturalWidth);
		const width = Math.min(0.8, 0.8 * ratio);
		const height = width / ratio;
		crop = { x: (1 - width) / 2, y: (1 - height) / 2, width, height };
	}

	/** Draws the selection to a canvas and hands back a WebP file within the upload limit. */
	async function apply() {
		if (!picture || selectedWidth < 1 || selectedHeight < 1) return;
		working = true;
		error = '';
		try {
			const output = document.createElement('canvas');
			const scale = Math.min(1, MAX_OUTPUT_EDGE / Math.max(selectedWidth, selectedHeight));
			output.width =
				shape === 'website' ? guide.width : Math.max(1, Math.round(selectedWidth * scale));
			output.height =
				shape === 'website' ? guide.height : Math.max(1, Math.round(selectedHeight * scale));
			const context = output.getContext('2d');
			if (!context) throw new Error('Could not create the cropped image.');
			context.drawImage(
				picture,
				crop.x * picture.naturalWidth,
				crop.y * picture.naturalHeight,
				crop.width * picture.naturalWidth,
				crop.height * picture.naturalHeight,
				0,
				0,
				output.width,
				output.height
			);
			const blob = await new Promise<Blob | null>((resolve) =>
				output.toBlob(resolve, 'image/webp', 0.88)
			);
			if (!blob) throw new Error('Could not create the cropped image.');
			if (blob.size > MAX_IMAGE_BYTES)
				throw new Error(`The cropped image exceeds ${IMAGE_SIZE_LABEL}. Select a smaller area.`);
			onApply(
				new File([blob], file.name.replace(/\.[^.]+$/, '') + '-cropped.webp', {
					type: 'image/webp'
				})
			);
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'Could not crop this image.';
			working = false;
		}
	}
</script>

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'Escape' && !working) onCancel();
	}}
/>
<div class="crop-backdrop" role="presentation">
	<div class="crop-dialog" role="dialog" aria-modal="true" aria-label="Crop image">
		<h2>Crop image</h2>
		<p class="editor-help">
			Recommended: {guide.width} × {guide.height} px. Source: {picture
				? `${picture.naturalWidth} × ${picture.naturalHeight} px`
				: 'Loading…'}.
		</p>
		{#if guide.note}<p class="editor-help">{guide.note}</p>{/if}
		<div class="crop-shapes" role="group" aria-label="Crop shape">
			<button
				type="button"
				class:active={shape === 'free'}
				aria-pressed={shape === 'free'}
				disabled={working}
				onclick={() => chooseShape('free')}>Free crop</button
			>
			<button
				type="button"
				class:active={shape === 'website'}
				aria-pressed={shape === 'website'}
				disabled={working}
				onclick={() => chooseShape('website')}>Website shape</button
			>
		</div>
		<p class="editor-help">
			Drag on the photo to select an area. Drag inside the frame to move it, or drag a corner to
			resize it.
		</p>
		{#if picture}
			<div
				bind:this={stage}
				class="crop-stage"
				role="button"
				tabindex="0"
				aria-label="Photo crop area. Drag to select, move or resize. Arrow keys move the selection."
				style={`width: min(100%, ${stageWidth}px); aspect-ratio: ${picture.naturalWidth} / ${picture.naturalHeight};`}
				onpointerdown={start}
				onpointermove={move}
				onpointerup={stop}
				onpointercancel={stop}
				onkeydown={keyboard}
			>
				<img src={sourceUrl} alt="" draggable="false" />
				<div
					class="crop-selection"
					style={`left: ${crop.x * 100}%; top: ${crop.y * 100}%; width: ${crop.width * 100}%; height: ${crop.height * 100}%;`}
				>
					{#each ['nw', 'ne', 'sw', 'se'] as handle (handle)}<span
							class={`crop-handle ${handle}`}
							data-handle={handle}
						></span>{/each}
				</div>
			</div>
			<p class="editor-help">
				Selected area: {selectedWidth} × {selectedHeight} source px. {shape === 'website'
					? `Output: ${guide.width} × ${guide.height} px.`
					: 'The website may trim a free crop to fit its frame.'}
			</p>
		{/if}
		{#if file.type === 'image/gif'}<p class="editor-help">
				Cropping a GIF saves its first frame as a still image.
			</p>{/if}
		{#if error}<p class="cms-error" role="alert">{error}</p>{/if}
		<div class="crop-actions">
			<button type="button" class="cms-secondary" disabled={working} onclick={onCancel}
				>Cancel</button
			>
			<button type="button" class="cms-primary" disabled={working || !picture} onclick={apply}
				>{working ? 'Preparing…' : 'Crop and upload'}</button
			>
		</div>
	</div>
</div>

<script lang="ts">
	import { onMount } from 'svelte';
	import type { ImageGuide } from '$lib/content/image-guides';
	import { MAX_IMAGE_BYTES, IMAGE_SIZE_LABEL } from '$lib/content/uploads';
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
	let canvas: HTMLCanvasElement;
	let picture = $state<HTMLImageElement | undefined>();
	let zoom = $state(1);
	let horizontal = $state(50);
	let vertical = $state(50);
	let working = $state(false);
	let error = $state('');
	let sourceSize = $state('');
	const previewWidth = 480;
	const previewHeight = $derived(Math.round((previewWidth * guide.height) / guide.width));

	function draw(target: HTMLCanvasElement, width: number, height: number) {
		if (!picture) return;
		const context = target.getContext('2d');
		if (!context) return;
		const scale = Math.max(width / picture.naturalWidth, height / picture.naturalHeight) * zoom;
		const drawnWidth = picture.naturalWidth * scale;
		const drawnHeight = picture.naturalHeight * scale;
		const x = ((width - drawnWidth) * horizontal) / 100;
		const y = ((height - drawnHeight) * vertical) / 100;
		context.clearRect(0, 0, width, height);
		context.drawImage(picture, x, y, drawnWidth, drawnHeight);
	}

	$effect(() => {
		zoom;
		horizontal;
		vertical;
		if (canvas && picture) draw(canvas, previewWidth, previewHeight);
	});

	onMount(() => {
		const url = URL.createObjectURL(file);
		const image = new Image();
		image.onload = () => {
			picture = image;
			sourceSize = `${image.naturalWidth} × ${image.naturalHeight} px`;
			draw(canvas, previewWidth, previewHeight);
		};
		image.onerror = () => (error = 'This image could not be opened. Choose another file.');
		image.src = url;
		return () => URL.revokeObjectURL(url);
	});

	async function apply() {
		if (!picture) return;
		working = true;
		error = '';
		try {
			const output = document.createElement('canvas');
			output.width = guide.width;
			output.height = guide.height;
			draw(output, guide.width, guide.height);
			const blob = await new Promise<Blob | null>((resolve) =>
				output.toBlob(resolve, 'image/webp', 0.88)
			);
			if (!blob) throw new Error('Could not create the cropped image.');
			if (blob.size > MAX_IMAGE_BYTES)
				throw new Error(`The cropped image exceeds ${IMAGE_SIZE_LABEL}. Choose a simpler image.`);
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

<div class="crop-backdrop" role="presentation">
	<div class="crop-dialog" role="dialog" aria-modal="true" aria-label="Crop image">
		<h2>Crop image</h2>
		<p class="editor-help">
			Recommended: {guide.width} × {guide.height} px. Source: {sourceSize || 'Loading…'}.
		</p>
		{#if guide.note}<p class="editor-help">{guide.note}</p>{/if}
		<canvas
			bind:this={canvas}
			width={previewWidth}
			height={previewHeight}
			aria-label="Cropped image preview"
		></canvas>
		<p class="editor-help">
			Adjust the framing. The uploaded image will be {guide.width} × {guide.height} px.
		</p>
		{#if file.type === 'image/gif'}<p class="editor-help">
				Cropping a GIF saves its first frame as a still image.
			</p>{/if}
		<label
			>Zoom <input
				type="range"
				min="1"
				max="3"
				step="0.01"
				bind:value={zoom}
				disabled={working}
			/></label
		>
		<label
			>Horizontal position <input
				type="range"
				min="0"
				max="100"
				step="1"
				bind:value={horizontal}
				disabled={working}
			/></label
		>
		<label
			>Vertical position <input
				type="range"
				min="0"
				max="100"
				step="1"
				bind:value={vertical}
				disabled={working}
			/></label
		>
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

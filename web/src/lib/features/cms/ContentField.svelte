<script lang="ts">
	import ContentField from './ContentField.svelte';
	import { defaultFor, type Field } from '$lib/content/schema';
	import {
		IMAGE_SIZE_LABEL,
		IMAGE_MIME_TYPES,
		MAX_SOURCE_IMAGE_BYTES,
		SOURCE_IMAGE_SIZE_LABEL
	} from '$lib/content/uploads';
	import { imageGuide } from '$lib/content/image-guides';
	import ImageCropper from './ImageCropper.svelte';
	import SectionOrderEditor from './SectionOrderEditor.svelte';
	let {
		field,
		value = $bindable(),
		path,
		disabled = false,
		collapsible = false,
		onUploadChange
	}: {
		field: Field;
		value: any; // eslint-disable-line @typescript-eslint/no-explicit-any
		path: string;
		disabled?: boolean;
		collapsible?: boolean;
		onUploadChange?: (active: boolean) => void;
	} = $props();
	let uploading = $state(false),
		message = $state(''),
		selectedFile = $state<File | null>(null),
		expanded = $state<boolean[]>([]);
	const id = $derived(`field-${path.replace(/[^a-z0-9-]/gi, '-')}`);
	const guide = $derived(imageGuide(path));
	function move(index: number, direction: number) {
		const next = [...value];
		[next[index], next[index + direction]] = [next[index + direction], next[index]];
		value = next;
		const open = [...expanded];
		[open[index], open[index + direction]] = [
			open[index + direction] ?? false,
			open[index] ?? false
		];
		expanded = open;
	}
	function itemTitle(index: number): string {
		const item = value[index];
		return (
			['title', 'question', 'heading', 'label']
				.map((key) => item?.[key])
				.find((text) => typeof text === 'string' && text.trim()) ?? 'Untitled item'
		);
	}
	function selectImage(event: Event) {
		const input = event.currentTarget as HTMLInputElement,
			file = input.files?.[0];
		if (!file) return;
		message = '';
		if (!IMAGE_MIME_TYPES.includes(file.type) || !file.size || file.size > MAX_SOURCE_IMAGE_BYTES) {
			message = `Choose a JPG, PNG, WebP, or GIF up to ${SOURCE_IMAGE_SIZE_LABEL}.`;
			input.value = '';
			return;
		}
		selectedFile = file;
		onUploadChange?.(true);
		input.value = '';
	}
	function cancelCrop() {
		selectedFile = null;
		onUploadChange?.(false);
	}
	async function upload(file: File) {
		selectedFile = null;
		uploading = true;
		try {
			const body = new FormData();
			body.set('file', file);
			body.set('bucket', 'site');
			const response = await fetch('/api/uploads', { method: 'POST', body });
			const result = await response.json();
			if (!response.ok) throw new Error(result.message || 'Upload failed.');
			value = result.url;
		} catch (error) {
			message = error instanceof Error ? error.message : 'Upload failed. Please try again.';
		} finally {
			uploading = false;
			onUploadChange?.(false);
		}
	}
</script>

{#snippet groupFields(hideLegend: boolean)}
	<fieldset class="editor-group" {disabled}>
		<legend class:cms-visually-hidden={hideLegend}>{field.label}</legend>{#if field.help}<p
				class="editor-help"
			>
				{field.help}
			</p>{/if}
		{#each Object.entries(field.fields ?? {}) as [key, child] (key)}<ContentField
				field={child}
				bind:value={value[key]}
				path={`${path}-${key}`}
				{disabled}
				{onUploadChange}
			/>{/each}
	</fieldset>
{/snippet}

{#snippet listItem(index: number)}
	<div class="editor-item-actions">
		<span>{field.item?.label} {index + 1}</span>
		<button
			type="button"
			class="cms-subtle"
			disabled={disabled || index === 0}
			aria-label={`Move ${field.item?.label} ${index + 1} up`}
			onclick={() => move(index, -1)}>↑</button
		>
		<button
			type="button"
			class="cms-subtle"
			disabled={disabled || index === value.length - 1}
			aria-label={`Move ${field.item?.label} ${index + 1} down`}
			onclick={() => move(index, 1)}>↓</button
		>
		<button
			type="button"
			class="cms-subtle danger"
			{disabled}
			onclick={() => {
				value = value.filter((_: unknown, i: number) => i !== index);
				expanded = expanded.filter((_, i) => i !== index);
			}}>Remove</button
		>
	</div>
	<ContentField
		field={field.item!}
		bind:value={value[index]}
		path={`${path}-${index}`}
		{disabled}
		{onUploadChange}
	/>
{/snippet}

{#if field.editor === 'sectionOrder'}
	<SectionOrderEditor bind:value {disabled} />
{:else if field.kind === 'group'}
	{#if collapsible}
		<details class="editor-disclosure">
			<summary>{field.label}</summary>
			<div class="editor-disclosure-body">{@render groupFields(true)}</div>
		</details>
	{:else}
		{@render groupFields(false)}
	{/if}
{:else if field.kind === 'list'}
	<fieldset class="editor-group" {disabled}>
		<legend>{field.label}</legend>
		{#if field.item?.kind === 'group' && value.length}
			<p class="editor-help">Open an entry to edit its content or change its order.</p>
		{/if}
		{#each value.keys() as index (index)}
			{#if field.item?.kind === 'group'}
				<details class="editor-disclosure" bind:open={expanded[index]}>
					<summary>
						<span class="editor-item-number">{index + 1}</span>
						<span class="editor-item-title">{itemTitle(index)}</span>
					</summary>
					<div class="editor-disclosure-body">{@render listItem(index)}</div>
				</details>
			{:else}
				<div class="editor-list-item editor-simple-item">{@render listItem(index)}</div>
			{/if}
		{/each}
		<button
			type="button"
			class="cms-secondary"
			disabled={disabled || value.length >= 50}
			onclick={() => {
				expanded = [...value.map((_: unknown, index: number) => expanded[index] ?? false), true];
				value = [...value, defaultFor(field.item!)];
			}}>+ Add {field.item?.label.toLowerCase()}</button
		>
	</fieldset>
{:else if field.kind === 'boolean'}
	<label class="editor-toggle" for={id}
		><input {id} type="checkbox" bind:checked={value} {disabled} /> {field.label}</label
	>
{:else}
	<div class="editor-field">
		<label for={id}>{field.label}</label>
		{#if field.kind === 'textarea'}<textarea {id} bind:value rows="4" {disabled}
			></textarea>{:else}<input
				{id}
				type={field.kind === 'email' ? 'email' : 'text'}
				bind:value
				{disabled}
				autocomplete="off"
			/>{/if}
		{#if field.kind === 'image'}{#if value}<img
					class="editor-image"
					src={value}
					alt={`${field.label} preview`}
				/>{/if}
			<label class="cms-secondary upload-control"
				>{uploading ? 'Uploading…' : 'Upload image'}<input
					type="file"
					accept="image/jpeg,image/png,image/webp,image/gif"
					disabled={disabled || uploading}
					onchange={selectImage}
				/></label
			>
			<p class="editor-help">
				Recommended: {guide.width} × {guide.height} px. Crop and position the image before upload.{#if guide.note}
					{guide.note}{/if}
			</p>
			<p class="editor-help">
				JPG, PNG, WebP or GIF. Original photo: up to {SOURCE_IMAGE_SIZE_LABEL}; cropped upload: up
				to {IMAGE_SIZE_LABEL}.
			</p>{/if}
		{#if field.help}<p class="editor-help">{field.help}</p>{/if}{#if message}<p
				class="cms-error"
				role="alert"
			>
				{message}
			</p>{/if}
	</div>
{/if}
{#if selectedFile}<ImageCropper
		file={selectedFile}
		{guide}
		onApply={upload}
		onCancel={cancelCrop}
	/>{/if}

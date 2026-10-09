<!--
	Renders one schema field and its children recursively: groups become
	fieldsets, lists get add/remove/reorder controls, images get crop-and-upload.
	`path` must be unique per field; it builds input ids and picks image guides.
-->
<script lang="ts">
	import ContentField from './ContentField.svelte';
	import ImageCropper from './ImageCropper.svelte';
	import SectionOrderEditor from './SectionOrderEditor.svelte';
	import { cmsRequest, errorMessage } from './api';
	import { defaultFor, MAX_LIST_ITEMS, type Field } from '$lib/content/schema';
	import {
		IMAGE_SIZE_LABEL,
		IMAGE_MIME_TYPES,
		MAX_SOURCE_IMAGE_BYTES,
		SOURCE_IMAGE_SIZE_LABEL,
		type UploadBucket
	} from '$lib/content/uploads';
	import { imageGuide } from '$lib/content/image-guides';
	import { error, help, secondary, subtle, subtleDanger, visuallyHidden } from './styles';

	let {
		field,
		value = $bindable(),
		path,
		bucket = 'site',
		disabled = false,
		collapsible = false,
		nested = false,
		inDisclosure = false,
		inSimpleItem = false,
		inCollection = false,
		onUploadChange
	}: {
		field: Field;
		value: any; // eslint-disable-line @typescript-eslint/no-explicit-any
		path: string;
		/** Storage bucket for image uploads. */
		bucket?: UploadBucket;
		disabled?: boolean;
		/** Render a group as a closed disclosure instead of an open fieldset. */
		collapsible?: boolean;
		/** Rendered inside another group or list fieldset. */
		nested?: boolean;
		/** Rendered as the direct content of a disclosure body. */
		inDisclosure?: boolean;
		/** Rendered beside the move/remove controls of a one-field list entry. */
		inSimpleItem?: boolean;
		/** Rendered in a collection item form. */
		inCollection?: boolean;
		/** Called with `true` when an image is chosen and `false` once its upload settles. */
		onUploadChange?: (active: boolean) => void;
	} = $props();
	let uploading = $state(false),
		message = $state(''),
		selectedFile = $state<File | null>(null),
		/** Open state of each list entry's disclosure, kept in step with reordering. */
		expanded = $state<boolean[]>([]);
	const id = $derived(`field-${path.replace(/[^a-z0-9-]/gi, '-')}`);
	const guide = $derived(imageGuide(path));
	const simpleItem = $derived(field.item?.kind !== 'group');

	/** Group and list fieldsets; nested ones get a divider unless they fill a disclosure. */
	function groupClass(isNested: boolean, isDisclosureBody: boolean) {
		if (isDisclosureBody) return 'm-0 min-w-0 [border:0] p-0';
		if (isNested)
			return 'mx-0 mt-6 mb-7 min-w-0 [border-top:1px_solid_#dce5e2] [border-right:0] [border-bottom:0] [border-left:0] px-0 pt-[18px] pb-0';
		return 'm-0 mb-7 min-w-0 [border:0] p-0';
	}
	const legendClass = $derived(
		nested
			? 'mb-[18px] py-0 pr-2 pl-0 font-arial text-[1rem]/[1.5] font-semibold'
			: 'mb-[18px] text-[2rem]'
	);
	const disclosure = 'mb-3 rounded-lg border border-line bg-white';
	const summary =
		"flex min-h-14 cursor-pointer [list-style:none] items-center gap-3 px-4 py-[14px] text-[0.875rem] font-semibold after:ml-auto after:text-[1.25rem] after:text-cyan-ink after:content-['+'] [&::-webkit-details-marker]:hidden [[open]>&]:rounded-t-lg [[open]>&]:border-b [[open]>&]:border-b-line [[open]>&]:bg-[#edf7f4] [[open]>&]:after:content-['−']";
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
	/** Summary label for a list entry: its first non-empty title-like field. */
	function itemTitle(index: number): string {
		const item = value[index];
		return (
			['title', 'question', 'heading', 'label']
				.map((key) => item?.[key])
				.find((text) => typeof text === 'string' && text.trim()) ?? 'Untitled item'
		);
	}
	/** Checks the chosen file, then opens the cropper (upload happens after cropping). */
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
	/** Uploads the cropped image and stores its public URL as the field value. */
	async function upload(file: File) {
		selectedFile = null;
		uploading = true;
		try {
			const body = new FormData();
			body.set('file', file);
			body.set('bucket', bucket);
			const result = await cmsRequest<{ url: string }>(
				'/api/uploads',
				{ method: 'POST', body },
				'Upload failed.'
			);
			value = result.url;
		} catch (error) {
			message = errorMessage(error, 'Upload failed. Please try again.');
		} finally {
			uploading = false;
			onUploadChange?.(false);
		}
	}
</script>

{#snippet groupFields(hideLegend: boolean, isDisclosureBody: boolean)}
	<fieldset class={groupClass(nested, isDisclosureBody)} {disabled}>
		<legend class={[legendClass, hideLegend && visuallyHidden]}>{field.label}</legend
		>{#if field.help}<p class={help}>
				{field.help}
			</p>{/if}
		{#each Object.entries(field.fields ?? {}) as [key, child] (key)}<ContentField
				field={child}
				bind:value={value[key]}
				path={`${path}-${key}`}
				nested
				{disabled}
				{onUploadChange}
			/>{/each}
	</fieldset>
{/snippet}

{#snippet listItem(index: number)}
	<div
		class={simpleItem
			? 'col-[2] row-[1] m-0 flex flex-wrap items-center gap-1 bp-760:col-[1] bp-760:row-[2] bp-760:justify-end'
			: 'mb-4 flex flex-wrap items-center gap-1'}
	>
		<span class={['mr-auto text-[0.8rem] font-bold', simpleItem && 'hidden']}
			>{field.item?.label} {index + 1}</span
		>
		<button
			type="button"
			class={subtle}
			disabled={disabled || index === 0}
			aria-label={`Move ${field.item?.label} ${index + 1} up`}
			onclick={() => move(index, -1)}>↑</button
		>
		<button
			type="button"
			class={subtle}
			disabled={disabled || index === value.length - 1}
			aria-label={`Move ${field.item?.label} ${index + 1} down`}
			onclick={() => move(index, 1)}>↓</button
		>
		<button
			type="button"
			class={subtleDanger}
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
		nested
		inDisclosure={!simpleItem}
		inSimpleItem={simpleItem}
		{disabled}
		{onUploadChange}
	/>
{/snippet}

{#if field.editor === 'sectionOrder'}
	<SectionOrderEditor bind:value {disabled} />
{:else if field.kind === 'group'}
	{#if collapsible}
		<details class={disclosure}>
			<summary class={summary}>{field.label}</summary>
			<div class="p-[18px]">{@render groupFields(true, true)}</div>
		</details>
	{:else}
		{@render groupFields(false, inDisclosure)}
	{/if}
{:else if field.kind === 'list'}
	<fieldset class={groupClass(nested, inDisclosure)} {disabled}>
		<legend class={legendClass}>{field.label}</legend>
		{#if field.item?.kind === 'group' && value.length}
			<p class={help}>Open an entry to edit its content or change its order.</p>
		{/if}
		{#each value.keys() as index (index)}
			{#if field.item?.kind === 'group'}
				<details class={disclosure} bind:open={expanded[index]}>
					<summary class={summary}>
						<span
							class="grid size-[26px] shrink-0 place-items-center rounded-[5px] bg-[#e9f3ef] text-[0.75rem] text-cyan-ink"
							>{index + 1}</span
						>
						<span class="min-w-0 truncate">{itemTitle(index)}</span>
					</summary>
					<div class="p-[18px]">{@render listItem(index)}</div>
				</details>
			{:else}
				<div
					class="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-line bg-white p-3 bp-760:grid-cols-[minmax(0,1fr)] bp-760:gap-2"
				>
					{@render listItem(index)}
				</div>
			{/if}
		{/each}
		<button
			type="button"
			class={secondary}
			disabled={disabled || value.length >= MAX_LIST_ITEMS}
			onclick={() => {
				expanded = [...value.map((_: unknown, index: number) => expanded[index] ?? false), true];
				value = [...value, defaultFor(field.item!)];
			}}>+ Add {field.item?.label.toLowerCase()}</button
		>
	</fieldset>
{:else if field.kind === 'boolean'}
	<label class="mb-5 flex items-center gap-3" for={id}
		><input class="size-5 accent-cyan-ink" {id} type="checkbox" bind:checked={value} {disabled} />
		{field.label}</label
	>
{:else}
	<div class={inSimpleItem ? 'col-[1] row-[1] m-0' : 'mb-5'}>
		<label
			class={inCollection
				? 'mb-[7px] grid gap-[6px] text-[0.875rem] font-semibold'
				: 'mb-[7px] block text-[0.875rem] font-semibold'}
			for={id}>{field.label}</label
		>
		{#if field.kind === 'textarea'}<textarea {id} bind:value rows="4" {disabled}
			></textarea>{:else}<input
				{id}
				type={field.kind === 'email' ? 'email' : 'text'}
				bind:value
				{disabled}
				autocomplete="off"
			/>{/if}
		{#if field.kind === 'image'}{#if value}<img
					class="my-3 block max-h-[220px] max-w-full rounded-[6px] object-contain"
					src={value}
					alt={`${field.label} preview`}
				/>{/if}
			<label
				class="my-2 inline-flex min-h-11 max-w-full cursor-pointer flex-wrap items-center justify-center gap-2 rounded-[6px] border border-[#b7c6c7] bg-transparent px-[18px] py-[11px] text-[0.875rem] font-semibold text-ink no-underline"
				>{uploading ? 'Uploading…' : 'Upload image'}<input
					class="ml-0 w-[230px] max-w-full min-w-0 text-[0.75rem]"
					type="file"
					accept={IMAGE_MIME_TYPES.join(',')}
					disabled={disabled || uploading}
					onchange={selectImage}
				/></label
			>
			<p class={help}>
				Recommended: {guide.width} × {guide.height} px. Crop and position the image before upload.{#if guide.note}
					{guide.note}{/if}
			</p>
			<p class={help}>
				JPG, PNG, WebP or GIF. Original photo: up to {SOURCE_IMAGE_SIZE_LABEL}; cropped upload: up
				to {IMAGE_SIZE_LABEL}.
			</p>{/if}
		{#if field.help}<p class={help}>{field.help}</p>{/if}{#if message}<p class={error} role="alert">
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

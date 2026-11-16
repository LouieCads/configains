<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import Upload from '@lucide/svelte/icons/upload';
	import X from '@lucide/svelte/icons/x';
	import { enhance } from '$app/forms';
	import { toast } from '$lib/features/cms/toast.svelte';
	import {
		DEMO_MIME_TYPES,
		DEMO_SIZE_LABEL,
		MAX_DEMO_BYTES,
		demoMediaUrl,
		mediaKindOf
	} from '$lib/coaching/demo';
	import {
		help,
		neutral,
		primary,
		requiredMark,
		secondary,
		subtle
	} from '$lib/features/cms/styles';

	/** Adds or edits one exercise library entry. The demo clip uploads before the form is saved. */
	let {
		entry = null,
		onDone
	}: {
		entry?: {
			id: string;
			name: string;
			youtube_id: string | null;
			media_path: string | null;
		} | null;
		onDone?: () => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	let mediaPath = $state(entry?.media_path ?? '');
	let uploading = $state(false);
	let saving = $state(false);
	const accept = Object.keys(DEMO_MIME_TYPES).join(',');
	const idPrefix = $props.id();

	async function upload(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		if (!DEMO_MIME_TYPES[file.type] || file.size > MAX_DEMO_BYTES) {
			toast.error(`Use a GIF, WebP, MP4 or WebM under ${DEMO_SIZE_LABEL}`);
			input.value = '';
			return;
		}
		uploading = true;
		try {
			const start = await fetch('/api/exercise-media', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ type: file.type, size: file.size })
			});
			const ticket = (await start.json().catch(() => ({}))) as {
				path?: string;
				signedUrl?: string;
				message?: string;
			};
			if (!start.ok || !ticket.path || !ticket.signedUrl)
				throw new Error(ticket.message ?? "Couldn't start the upload");

			// Same request shape as Supabase's uploadToSignedUrl.
			const body = new FormData();
			body.append('cacheControl', '31536000');
			body.append('', file);
			const sent = await fetch(ticket.signedUrl, {
				method: 'PUT',
				headers: { 'x-upsert': 'false' },
				body
			});
			if (!sent.ok) throw new Error("Couldn't upload the file");
			mediaPath = ticket.path;
		} catch (problem) {
			toast.error(problem instanceof Error ? problem.message : 'Upload failed');
		} finally {
			uploading = false;
			input.value = '';
		}
	}
</script>

<form
	method="POST"
	action="?/save"
	class="grid gap-4"
	use:enhance={() => {
		saving = true;
		return async ({ result, update }) => {
			saving = false;
			if (result.type === 'failure') {
				toast.error(String(result.data?.message ?? "Couldn't save exercise"));
				return;
			}
			await update({ reset: !entry });
			if (result.type === 'success') {
				if (!entry) mediaPath = '';
				onDone?.();
			}
		};
	}}
>
	{#if entry}<input type="hidden" name="id" value={entry.id} />{/if}
	<input type="hidden" name="media_path" value={mediaPath} />

	<div class="grid gap-4 min-[760px]:grid-cols-2">
		<label class="grid gap-1 font-semibold"
			><span>Exercise name<span class={requiredMark} aria-hidden="true">*</span></span>
			<input
				name="name"
				maxlength="120"
				required
				value={entry?.name ?? ''}
				placeholder="e.g. Goblet squat"
			/>
		</label>
		<label class="grid gap-1 font-semibold"
			>YouTube link
			<input
				name="youtube"
				type="url"
				inputmode="url"
				placeholder="https://youtu.be/…"
				value={entry?.youtube_id ? `https://youtu.be/${entry.youtube_id}` : ''}
			/>
		</label>
	</div>
	<p class="{help} -mt-2!">
		Must match the exercise name in your templates (capitals ignored). YouTube links play in-app.
	</p>

	<div class="grid gap-2">
		<span class="font-semibold" id="{idPrefix}-clip">Demo clip (GIF or short video)</span>
		{#if mediaPath}
			<div class="flex flex-wrap items-center gap-3">
				{#if mediaKindOf(mediaPath) === 'video'}
					<video
						class="h-24 rounded-md bg-black"
						src={demoMediaUrl(mediaPath)}
						muted
						loop
						autoplay
						playsinline
					></video>
				{:else}
					<img class="h-24 rounded-md" src={demoMediaUrl(mediaPath)} alt="Current demo clip" />
				{/if}
				<button type="button" class={subtle} onclick={() => (mediaPath = '')}
					><X size={16} aria-hidden="true" />Remove clip</button
				>
			</div>
		{/if}
		<label class="{secondary} justify-self-start" aria-describedby="{idPrefix}-clip">
			<Upload size={18} aria-hidden="true" />{uploading
				? 'Uploading…'
				: mediaPath
					? 'Replace clip'
					: 'Upload clip'}
			<input class="sr-only" type="file" {accept} disabled={uploading} onchange={upload} />
		</label>
		<p class="{help} m-0!">
			Up to {DEMO_SIZE_LABEL}. Short loops (5 to 10 seconds) load fastest.
		</p>
	</div>

	<div class="flex flex-wrap gap-3">
		<button class={primary} disabled={saving || uploading}
			><Check size={18} aria-hidden="true" />{saving
				? 'Saving…'
				: entry
					? 'Save'
					: 'Add to library'}</button
		>
		{#if onDone && entry}
			<button type="button" class={neutral} onclick={onDone}>Cancel</button>
		{/if}
	</div>
</form>

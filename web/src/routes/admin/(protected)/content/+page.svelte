<!--
	Website editor. Edits the whole website document locally, then:
	Save draft (PUT) → Preview saved draft (?preview=1) → Publish website (POST).
	`revision` tracks the draft version the server last confirmed so stale
	sessions get a conflict instead of overwriting newer work.
-->
<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import ContentTabs from '$lib/features/cms/ContentTabs.svelte';
	import ConfirmDialog from '$lib/features/cms/ConfirmDialog.svelte';
	import { cmsRequest, errorMessage } from '$lib/features/cms/api';
	import { useLeaveGuard } from '$lib/features/cms/leave-guard.svelte';
	import {
		error as errorClass,
		eyebrow,
		help,
		primary,
		secondary,
		subtle,
		success
	} from '$lib/features/cms/styles';
	import {
		validateWebsite,
		websitePagePath,
		websitePages,
		websiteSchema,
		type Content,
		type WebsitePage
	} from '$lib/content/schema';

	/** Formats a timestamp in Philippine time as "October 09, 2026, 08:57 AM". */
	function formatDateTime(value: string | number | Date): string {
		const parts = new Intl.DateTimeFormat('en-US', {
			timeZone: 'Asia/Manila',
			year: 'numeric',
			month: 'long',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			hour12: true
		}).formatToParts(new Date(value));
		const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
		return `${get('month')} ${get('day')}, ${get('year')}, ${get('hour')}:${get('minute')} ${get('dayPeriod')}`;
	}

	type DialogAction = 'publish' | 'discard' | 'leave';
	const dialogs: Record<
		DialogAction,
		{ title: string; message: string; confirmLabel: string; danger: boolean }
	> = {
		publish: {
			title: 'Publish your website?',
			message: 'Your saved changes will appear on the public website.',
			confirmLabel: 'Publish website',
			danger: false
		},
		discard: {
			title: 'Discard your edits?',
			message: 'Unsaved changes will be replaced with your last saved draft.',
			confirmLabel: 'Discard edits',
			danger: true
		},
		leave: {
			title: 'Leave this page?',
			message: 'You have unsaved changes. Leaving now will discard them.',
			confirmLabel: 'Leave page',
			danger: true
		}
	};

	let { data } = $props();
	let content = $state<Content>(untrack(() => structuredClone(data.content)));
	/** Serialized content as last saved; edits are "dirty" until they match it. */
	let baseline = $state(untrack(() => JSON.stringify(data.content))),
		revision = $state(untrack(() => data.revision)),
		publishedRevision = $state(untrack(() => data.publishedRevision));
	let ready = $state(false),
		active = $state('home'),
		pendingUploads = $state(0),
		busy = $state(false),
		message = $state(''),
		errors = $state<string[]>([]);
	/** Last tab opened in each section, so switching sections keeps your place. */
	let selectedPanels = $state<Record<string, string>>({});
	let dialogAction = $state<'publish' | 'discard' | null>(null);

	const dirty = $derived(JSON.stringify(content) !== baseline);
	const guard = useLeaveGuard(() => dirty);
	const dialog = $derived(guard.pending ? 'leave' : dialogAction);
	/** True while hydration, a request, or an upload must finish first. */
	const locked = $derived(!ready || busy || pendingUploads > 0);
	const canPreview = $derived(!locked && !dirty && !!revision);

	const sections = Object.entries(websiteSchema.fields!);
	const isPage = (key: string): key is WebsitePage => websitePages.includes(key as WebsitePage);
	const sectionGroups = [
		{ label: 'Website pages', sections: sections.filter(([key]) => isPage(key)) },
		{ label: 'Shared content', sections: sections.filter(([key]) => !isPage(key)) }
	];
	const previewPath = $derived(isPage(active) ? websitePagePath(active) : '/');

	onMount(() => {
		ready = true;
	});

	function closeDialog() {
		dialogAction = null;
		guard.cancel();
	}

	async function confirmDialog() {
		const action = dialog;
		dialogAction = null;
		if (action === 'publish') await publish();
		else if (action === 'discard') discard();
		else if (action === 'leave') await guard.leave();
	}

	/** Validates and saves the draft. Resolves to whether it succeeded. */
	async function save() {
		message = '';
		errors = validateWebsite(content);
		if (errors.length) return false;
		busy = true;
		try {
			const result = await cmsRequest<{ revision: string }>(
				'/api/site-content',
				{ method: 'PUT', json: { content, revision } },
				'The draft could not be saved.'
			);
			revision = result.revision;
			baseline = JSON.stringify(content);
			message = 'Draft saved. Preview it before publishing.';
			return true;
		} catch (error) {
			errors = [errorMessage(error, 'Saving failed. Please try again.')];
			return false;
		} finally {
			busy = false;
		}
	}

	/** Saves pending edits first, then publishes the saved draft. */
	async function publish() {
		if ((dirty || !revision) && !(await save())) return;
		busy = true;
		message = '';
		errors = [];
		try {
			const result = await cmsRequest<{ publishedRevision: string }>(
				'/api/site-content',
				{ method: 'POST', json: { revision } },
				'Publishing failed.'
			);
			publishedRevision = result.publishedRevision;
			message = data.localAdminDemo
				? 'Published to your local preview.'
				: 'Published. Your changes are now live.';
		} catch (error) {
			errors = [errorMessage(error, 'Publishing failed. Please try again.')];
		} finally {
			busy = false;
		}
	}

	function discard() {
		content = JSON.parse(baseline);
		errors = [];
		message = 'Unsaved edits discarded.';
	}

	function trackUpload(uploading: boolean) {
		pendingUploads = Math.max(0, pendingUploads + (uploading ? 1 : -1));
	}
</script>

<svelte:head><title>Website editor | Configains CMS</title></svelte:head>
<div class="mb-7 max-w-[800px]">
	<p class={eyebrow}>CONTENT STUDIO</p>
	<h1>Your website. Your words.</h1>
</div>
<ConfirmDialog
	open={dialog !== null}
	{...dialogs[dialog ?? 'leave']}
	onCancel={closeDialog}
	onConfirm={() => void confirmDialog()}
/>
{#if data.unavailable}<p class={errorClass} role="alert">
		The content database is unavailable. Saving requires a working CMS connection.
	</p>{/if}
<div
	class="sticky top-3 z-[5] flex flex-wrap items-center gap-3 rounded-lg border border-line bg-paper p-4 [box-shadow:0_5px_20px_#183b360a] bp-760:static"
>
	<span class="mr-auto text-[0.85rem] bp-760:w-full"
		>{pendingUploads
			? 'Uploading image…'
			: dirty
				? 'Unsaved changes'
				: revision
					? 'Draft saved'
					: 'Ready to edit'}</span
	>
	<button class={secondary} disabled={locked || data.unavailable} onclick={save}
		>{busy ? 'Working…' : 'Save draft'}</button
	>
	<a
		class={secondary}
		href={`${previewPath}?preview=1`}
		target="_blank"
		rel="noopener"
		aria-disabled={!canPreview}
		onclick={(event) => {
			if (!canPreview) event.preventDefault();
		}}>Preview saved draft ↗</a
	>
	<button
		class={primary}
		disabled={locked || data.unavailable}
		onclick={() => (dialogAction = 'publish')}>Publish website</button
	>
	<button
		class={subtle}
		disabled={locked || !dirty}
		onclick={() => {
			if (dirty) dialogAction = 'discard';
		}}>Discard unsaved edits</button
	>
</div>
{#if message}<p class={success} role="status">{message}</p>{/if}
{#if errors.length}<div class={errorClass} role="alert">
		<strong>Please review:</strong>
		<ul>
			{#each errors as error (error)}<li>{error}</li>{/each}
		</ul>
	</div>{/if}
{#if publishedRevision}<p class={help}>
		Last published: {formatDateTime(publishedRevision)}
	</p>{/if}
<div class="mt-7 grid grid-cols-[210px_minmax(0,1fr)] gap-6 bp-1100:grid-cols-1">
	<nav
		class="flex flex-col gap-[6px] [align-self:start] bp-1100:flex-row bp-1100:flex-wrap"
		aria-label="Website sections"
	>
		<label
			class="hidden bp-760:grid bp-760:w-full bp-760:gap-2 bp-760:text-[0.875rem] bp-760:font-semibold"
			for="editor-page-choice"
		>
			Page or shared content
			<select id="editor-page-choice" bind:value={active} disabled={locked}>
				{#each sectionGroups as group (group.label)}
					<optgroup label={group.label}>
						{#each group.sections as [key, field] (key)}
							<option value={key}>{field.label}</option>
						{/each}
					</optgroup>
				{/each}
			</select>
		</label>
		{#each sectionGroups as group (group.label)}
			<div
				class="mb-[18px] grid gap-1 bp-1100:mb-0 bp-1100:flex bp-1100:flex-wrap bp-1100:gap-[6px] bp-760:hidden"
			>
				<p class="{eyebrow} mx-3 mt-0 mb-2 bp-1100:my-[6px] bp-1100:w-full">{group.label}</p>
				{#each group.sections as [key, field] (key)}
					<button
						type="button"
						class={[
							'rounded-[6px] p-3 text-left [border:0] hover:bg-[#e9f3ef]',
							active === key ? 'bg-[#d7f2f1] text-ink' : 'bg-transparent text-muted'
						]}
						aria-pressed={active === key}
						disabled={locked}
						onclick={() => (active = key)}>{field.label}</button
					>
				{/each}
			</div>
		{/each}
	</nav>
	<form
		class="min-w-0 rounded-[10px] border border-line bg-paper p-7 bp-760:p-5"
		onsubmit={(event) => {
			event.preventDefault();
			void save();
		}}
	>
		{#each sections as [key, field] (key)}{#if active === key}<ContentTabs
					{field}
					bind:value={content[key]}
					bind:active={selectedPanels[key]}
					path={key}
					disabled={locked}
					onUploadChange={trackUpload}
				/>{/if}{/each}<button class={primary} disabled={locked || data.unavailable}
			>Save draft</button
		>
	</form>
</div>

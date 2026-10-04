<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { onMount, untrack } from 'svelte';
	import ContentTabs from '$lib/features/cms/ContentTabs.svelte';
	import { websiteSchema, validateWebsite, type Content } from '$lib/content/schema';
	let { data } = $props();
	let content = $state<Content>(untrack(() => structuredClone(data.content)));
	let baseline = $state(untrack(() => JSON.stringify(data.content))),
		revision = $state(untrack(() => data.revision)),
		publishedRevision = $state(untrack(() => data.publishedRevision));
	let ready = $state(false),
		active = $state('home'),
		pendingUploads = $state(0),
		busy = $state(false),
		message = $state(''),
		errors = $state<string[]>([]);
	let selectedPanels = $state<Record<string, string>>({});
	const dirty = $derived(JSON.stringify(content) !== baseline),
		sections = Object.entries(websiteSchema.fields!);
	const pageKeys = ['home', 'about', 'coaching', 'transformations', 'contact'];
	const sectionGroups = [
		{
			label: 'Website pages',
			sections: pageKeys.map((key) => [key, websiteSchema.fields![key]] as const)
		},
		{ label: 'Shared content', sections: sections.filter(([key]) => !pageKeys.includes(key)) }
	];
	const previewPath = $derived(
		['about', 'coaching', 'transformations', 'contact'].includes(active) ? `/${active}` : '/'
	);
	onMount(() => {
		ready = true;
	});
	beforeNavigate(({ cancel }) => {
		if (dirty && !window.confirm('You have unsaved changes. Leave without saving?')) cancel();
	});
	async function save() {
		errors = validateWebsite(content);
		if (errors.length) {
			message = '';
			return false;
		}
		busy = true;
		message = '';
		errors = [];
		try {
			const response = await fetch('/api/site-content', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content, revision })
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.message || 'The draft could not be saved.');
			revision = result.revision;
			baseline = JSON.stringify(content);
			message = 'Draft saved. Preview it before publishing.';
			return true;
		} catch (error) {
			errors = [error instanceof Error ? error.message : 'Saving failed. Please try again.'];
			return false;
		} finally {
			busy = false;
		}
	}
	async function publish() {
		if (!window.confirm('Publish these changes to the public website?')) return;
		if ((dirty || !revision) && !(await save())) return;
		busy = true;
		message = '';
		errors = [];
		try {
			const response = await fetch('/api/site-content', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ revision })
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.message || 'Publishing failed.');
			publishedRevision = result.publishedRevision;
			message = data.localAdminDemo
				? 'Published to your local preview.'
				: 'Published. Your changes are now live.';
		} catch (error) {
			errors = [error instanceof Error ? error.message : 'Publishing failed. Please try again.'];
		} finally {
			busy = false;
		}
	}
	function discard() {
		if (!dirty || !window.confirm('Discard your unsaved edits and restore the saved draft?'))
			return;
		content = JSON.parse(baseline);
		errors = [];
		message = 'Unsaved edits discarded.';
	}
</script>

<svelte:head><title>Website editor | Configains CMS</title></svelte:head>
<svelte:window
	onbeforeunload={(event) => {
		if (dirty) {
			event.preventDefault();
			event.returnValue = '';
		}
	}}
/>
<div class="cms-page-heading">
	<p class="cms-eyebrow">CONTENT STUDIO</p>
	<h1>Your website. Your words.</h1>
	<p>
		Choose a page and a section tab, save your draft, and preview it before publishing. Search
		metadata and FAQs update alongside your pages.
	</p>
</div>
{#if data.unavailable}<p class="cms-error" role="alert">
		The content database is unavailable. Saving requires a working CMS connection.
	</p>{/if}
<div class="editor-toolbar">
	<span class="editor-status"
		>{pendingUploads
			? 'Uploading image…'
			: dirty
				? 'Unsaved changes'
				: revision
					? 'Draft saved'
					: 'Ready to edit'}</span
	>
	<button
		class="cms-secondary"
		disabled={!ready || busy || pendingUploads > 0 || data.unavailable}
		onclick={save}>{busy ? 'Working…' : 'Save draft'}</button
	>
	<a
		class="cms-secondary"
		href={`${previewPath}?preview=1`}
		target="_blank"
		rel="noopener"
		aria-disabled={!ready || dirty || !revision || pendingUploads > 0}
		onclick={(event) => {
			if (!ready || dirty || !revision || pendingUploads > 0) event.preventDefault();
		}}>Preview saved draft ↗</a
	>
	<button
		class="cms-primary"
		disabled={!ready || busy || pendingUploads > 0 || data.unavailable}
		onclick={publish}>Publish website</button
	>
	<button
		class="cms-subtle"
		disabled={!ready || busy || pendingUploads > 0 || !dirty}
		onclick={discard}>Discard unsaved edits</button
	>
</div>
{#if message}<p class="cms-success" role="status">{message}</p>{/if}
{#if errors.length}<div class="cms-error" role="alert">
		<strong>Please review:</strong>
		<ul>
			{#each errors as error (error)}<li>{error}</li>{/each}
		</ul>
	</div>{/if}
{#if publishedRevision}<p class="editor-help">
		Last published: {new Date(publishedRevision).toLocaleString()}
	</p>{/if}
<div class="website-editor">
	<nav class="editor-sections" aria-label="Website sections">
		<label class="editor-page-picker" for="editor-page-choice">
			Page or shared content
			<select
				id="editor-page-choice"
				bind:value={active}
				disabled={!ready || busy || pendingUploads > 0}
			>
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
			<div class="editor-section-group">
				<p class="cms-eyebrow">{group.label}</p>
				{#each group.sections as [key, field] (key)}
					<button
						type="button"
						class:active={active === key}
						aria-pressed={active === key}
						disabled={!ready || busy || pendingUploads > 0}
						onclick={() => (active = key)}>{field.label}</button
					>
				{/each}
			</div>
		{/each}
	</nav>
	<form
		class="editor-panel"
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
					disabled={!ready || busy || pendingUploads > 0}
					onUploadChange={(uploading) => {
						pendingUploads = Math.max(0, pendingUploads + (uploading ? 1 : -1));
					}}
				/>{/if}{/each}<button
			class="cms-primary"
			disabled={!ready || busy || pendingUploads > 0 || data.unavailable}>Save draft</button
		>
	</form>
</div>

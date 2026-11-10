<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import TemplateEditor from '$lib/features/coaching/TemplateEditor.svelte';
	import { help } from '$lib/features/cms/styles';
	let { data, form } = $props();
</script>

<svelte:head
	><title>{data.isNew ? 'New template' : data.template.name} | Configains CMS</title></svelte:head
>
<p class="mb-0">
	{#if data.owner}
		<a class="inline-flex items-center gap-1 text-cyan-ink" href="/admin/clients/{data.owner.id}"
			><ArrowLeft size={16} aria-hidden="true" />{data.owner.name}</a
		>
	{:else}
		<a class="inline-flex items-center gap-1 text-cyan-ink" href="/admin/templates"
			><ArrowLeft size={16} aria-hidden="true" />All templates</a
		>
	{/if}
</p>
<h1 class="my-3!">{data.isNew ? 'New template' : data.template.name}</h1>
{#if data.owner}
	<p class="{help} mt-0!">
		Private copy for {data.owner.name}. The library template is not changed.
	</p>
{/if}

{#key form?.draft ?? data.template}
	<TemplateEditor
		initial={form?.draft ?? data.template}
		isNew={data.isNew}
		message={form?.message ?? null}
		saved={data.saved}
		clientCopy={!!data.owner}
	/>
{/key}

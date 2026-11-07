<script lang="ts">
	import TemplateEditor from '$lib/features/coaching/TemplateEditor.svelte';
	import { help } from '$lib/features/cms/styles';
	let { data, form } = $props();
</script>

<svelte:head
	><title>{data.isNew ? 'New template' : data.template.name} | Configains CMS</title></svelte:head
>
<p class="mb-0">
	{#if data.owner}
		<a class="text-cyan-ink" href="/admin/clients/{data.owner.id}">← {data.owner.name}</a>
	{:else}
		<a class="text-cyan-ink" href="/admin/templates">← All templates</a>
	{/if}
</p>
<h1 class="my-3!">{data.isNew ? 'New template' : data.template.name}</h1>
{#if data.owner}
	<p class="{help} mt-0!">
		Customised copy for {data.owner.name}. Changes apply only to this client; the library template
		stays the same.
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

<script lang="ts">
	import TemplateEditor from '$lib/features/coaching/TemplateEditor.svelte';
	let { data, form } = $props();
</script>

<svelte:head
	><title>{data.isNew ? 'New template' : data.template.name} | Configains CMS</title></svelte:head
>
<h1>{data.isNew ? 'New template' : data.template.name}</h1>
<p><a href="/admin/templates">Back to templates</a></p>

{#key form?.draft ?? data.template}
	<TemplateEditor
		initial={form?.draft ?? data.template}
		isNew={data.isNew}
		message={form?.message ?? null}
		saved={data.saved}
	/>
{/key}

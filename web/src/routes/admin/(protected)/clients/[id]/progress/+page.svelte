<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ProgressDashboard from '$lib/features/progress/ProgressDashboard.svelte';
	let { data } = $props();
	const name = $derived(data.client.display_name ?? 'Client');
</script>

<svelte:head><title>Progress: {name} | Configains CMS</title></svelte:head>

<p class="mb-0">
	<a class="inline-flex items-center gap-1 text-cyan-ink" href="/admin/clients/{data.client.id}"
		><ArrowLeft size={16} aria-hidden="true" />{name}</a
	>
</p>
<h1 class="my-3!">Progress</h1>
<p class="mt-0 mb-6 text-muted">The same charts {name} sees on their own progress page.</p>

<div class="max-w-[820px]">
	<ProgressDashboard data={data.progress} today={data.today} audience="coach" />
</div>

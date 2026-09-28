<script lang="ts">
	let { data } = $props();
</script>

<svelte:head><title>Dashboard | Configains CMS</title></svelte:head>
<h1 class="text-4xl font-black tracking-tight">Dashboard</h1>
<p class="mt-2 text-slate-600">Manage the content shown across the Configains website.</p>
<div class="mt-10 grid gap-5 sm:grid-cols-3">
	{#each Object.entries(data.counts) as [label, count] (label)}<article
			class="rounded-2xl bg-white p-6 shadow-sm"
		>
			<p class="text-sm font-bold text-slate-500 capitalize">{label}</p>
			<p class="mt-3 text-4xl font-black">{count}</p>
		</article>{/each}
</div>

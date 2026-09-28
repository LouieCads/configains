<script lang="ts">
	import PageHero from '$lib/components/sections/PageHero.svelte';
	let { data } = $props();
</script>

<svelte:head
	><title>Transformations | Configains</title><meta
		name="description"
		content="Configains client transformation stories."
	/></svelte:head
>
<PageHero
	eyebrow="Transformations"
	title="Progress beyond the photo."
	copy="Real stories of strength, confidence, and consistency built one step at a time."
/>
<section class="mx-auto max-w-6xl px-6 py-20">
	{#if data.transformations.length}<div class="grid gap-8 md:grid-cols-2">
			{#each data.transformations as item (item.id)}<article
					class="overflow-hidden rounded-2xl bg-white shadow-sm"
				>
					{#if item.after_image_url}<img
							src={item.after_image_url}
							alt={item.title}
							class="aspect-video w-full object-cover"
						/>{/if}
					<div class="p-7">
						<h2 class="text-2xl font-black">{item.title}</h2>
						<p class="mt-3 text-slate-600">{item.summary}</p>
					</div>
				</article>{/each}
		</div>{:else}<p class="rounded-2xl bg-white p-8 text-slate-600">
			Transformation stories are coming soon.
		</p>{/if}
</section>

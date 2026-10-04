<script lang="ts">
	import PageHero from '$lib/components/sections/PageHero.svelte';
	let { data } = $props();
	const c = $derived(data.site.transformations),
		proof = $derived(data.site.home.proof);
</script>

<PageHero {...c.hero} />
<section class="section container">
	{#if data.transformations.length}<div class="transformation-grid">
			{#each data.transformations as item (item.id)}<article class="transformation-card">
					<div class="comparison">
						{#each [{ label: proof.before, src: item.before_image_url, alt: item.before_image_alt }, { label: proof.after, src: item.after_image_url, alt: item.after_image_alt }] as photo, index (index)}<div
								class="comparison-photo"
							>
								{#if photo.src}<img
										src={photo.src}
										alt={photo.alt || item.title + ': ' + photo.label}
										loading="lazy"
									/>{:else}<span class="image-placeholder">{proof.photoPlaceholder}</span>{/if}<span
									class="image-label">{photo.label}</span
								>
							</div>{/each}
					</div>
					<h2>{item.title}</h2>
					<p>{item.summary}</p>
					{#if item.story}<p class="pre-line">{item.story}</p>{/if}
				</article>{/each}
		</div>
	{:else}<p class="empty-message">{c.empty}</p>{/if}
</section>

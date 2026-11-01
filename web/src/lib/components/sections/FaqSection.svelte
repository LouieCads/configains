<script lang="ts">
	import type { Content } from '$lib/content/schema';
	import SectionLabel from '$lib/components/landing/SectionLabel.svelte';
	import SectionTitle from '$lib/components/landing/SectionTitle.svelte';
	import { reveal } from '$lib/components/landing/motion';
	import { anchor, container, rail, section } from '$lib/components/landing/styles';
	let { content }: { content: Content } = $props();
</script>

{#if content.enabled && content.items.length}<section
		id="faq"
		class="{section} {anchor}"
		aria-labelledby="faq-title"
	>
		<div class="{container} {rail} items-start">
			<div class="sticky top-28 cq-58:static" use:reveal>
				<SectionLabel>{content.eyebrow}</SectionLabel>
				<SectionTitle id="faq-title" heading={content.heading} />
			</div>
			<div class="border-b border-b-ink/20">
				{#each content.items as item, index (index)}<details class="group border-t border-t-ink/20">
						<summary
							class="flex min-h-[4.5rem] cursor-pointer list-none items-center justify-between gap-6 py-5 text-[1.1875rem]/[1.4] text-ink marker:hidden hover:text-cyan-deep [&::-webkit-details-marker]:hidden"
							>{item.question}<span
								class="relative grid size-9 flex-none place-items-center rounded-[3px] bg-mist text-ink [transition:background-color_0.25s,transform_0.35s_cubic-bezier(0.22,1,0.36,1)] group-open:rotate-45 group-open:bg-cyan"
								aria-hidden="true"
								><svg width="14" height="14" viewBox="0 0 14 14" fill="none"
									><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="1.8" /></svg
								></span
							></summary
						>
						<p class="max-w-[40rem] animate-rise pb-8 whitespace-pre-line">{item.answer}</p>
					</details>{/each}
			</div>
		</div>
	</section>{/if}

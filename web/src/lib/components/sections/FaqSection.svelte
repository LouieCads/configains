<script lang="ts">
	import type { Content } from '$lib/content/schema';
	import {
		anchor,
		container,
		eyebrow,
		outlined,
		section,
		sectionHeading
	} from '$lib/components/landing/styles';
	let { content }: { content: Content } = $props();
</script>

{#if content.enabled && content.items.length}<section
		id="faq"
		class="{section} {container} {anchor}"
		aria-labelledby="faq-title"
	>
		<div class={sectionHeading}>
			<div>
				<p class={eyebrow}>{content.eyebrow}</p>
				<h2 id="faq-title">
					{content.heading.first}<br /><span class={outlined}>{content.heading.accent}</span>
				</h2>
			</div>
		</div>
		<div>
			{#each content.items as item, index (index)}<details class="border-t border-t-line py-6">
					<summary
						class="flex cursor-pointer justify-between gap-6 font-arial text-[1.1rem]/[1.5] font-semibold"
						>{item.question}<span class="text-cyan-ink" aria-hidden="true">+</span></summary
					>
					<p class="mt-5 whitespace-pre-line">{item.answer}</p>
				</details>{/each}
		</div>
	</section>{/if}

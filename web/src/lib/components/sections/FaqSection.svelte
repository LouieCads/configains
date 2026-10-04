<script lang="ts">
	import type { Content } from '$lib/content/schema';
	let { content }: { content: Content } = $props();
</script>

{#if content.enabled && content.items.length}<section
		id="faq"
		class="section faq-section container"
		aria-labelledby="faq-title"
	>
		<div class="section-heading">
			<div>
				<p class="eyebrow">{content.eyebrow}</p>
				<h2 id="faq-title">
					{content.heading.first}<br /><span class="outlined-text">{content.heading.accent}</span>
				</h2>
			</div>
		</div>
		<div class="faq-list">
			{#each content.items as item, index (index)}<details>
					<summary>{item.question}<span aria-hidden="true">+</span></summary>
					<p>{item.answer}</p>
				</details>{/each}
		</div>
	</section>{/if}

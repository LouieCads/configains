<script lang="ts">
	import type { Content } from '$lib/content/schema';
	import { publicHref } from '$lib/content/links';
	import Arrow from './Arrow.svelte';
	import SectionLabel from './SectionLabel.svelte';
	import SectionTitle from './SectionTitle.svelte';
	import ServiceRows from './ServiceRows.svelte';
	import { reveal } from './motion';
	import { anchor, container, rail, section, textLink } from './styles';
	let {
		services,
		content,
		preview = false,
		number = '02'
	}: {
		services: Content[];
		content: Content;
		preview?: boolean;
		number?: string;
	} = $props();
</script>

<section id="coaching" class="{section} {anchor}" aria-labelledby="coaching-title">
	<div class="{container} {rail} items-start">
		<div class="sticky top-28 cq-58:static" use:reveal>
			<SectionLabel {number}>{content.eyebrow}</SectionLabel>
			<SectionTitle id="coaching-title" heading={content.heading} fit={{ cqi: 16, max: '5rem' }} />
		</div>
		<div>
			<ServiceRows {services} />
			<div class="mt-8 flex justify-end">
				<a class={textLink} href={publicHref('/contact', preview)}
					>{content.cta}<Arrow size={16} /></a
				>
			</div>
		</div>
	</div>
</section>

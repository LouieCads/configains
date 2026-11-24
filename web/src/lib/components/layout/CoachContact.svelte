<script lang="ts">
	// Cash's own channels (email and social profiles) from the CMS brand settings. Used wherever a
	// client has to reach the coach, instead of sending them to the assessment form on /contact.
	let {
		brand,
		subject = '',
		socialsOnly = false
	}: {
		brand: { email: string; socialLinks: { label: string; href: string }[] };
		subject?: string;
		socialsOnly?: boolean;
	} = $props();
	const mail = $derived(
		`mailto:${brand.email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`
	);
	const link = 'text-cyan-ink underline';
</script>

<span class="inline-flex flex-wrap gap-x-3 gap-y-1">
	{#if brand.email && !socialsOnly}<a class={link} href={mail}>{brand.email}</a>{/if}
	{#each brand.socialLinks as item, index (index)}<a
			class={link}
			href={item.href}
			target="_blank"
			rel="noopener noreferrer">{item.label}<span class="sr-only"> (opens in a new tab)</span></a
		>{/each}
</span>

<script lang="ts">
	import { page } from '$app/state';
	import type { Content } from '$lib/content/schema';
	import { buildStructuredData, jsonLd } from '$lib/content/seo';
	let {
		site,
		origin,
		preview = false
	}: { site: Content; origin: string; preview?: boolean } = $props();
	const path = $derived(page.url.pathname.replace(/\/+$/, '') || '/');
	const key = $derived(path === '/' ? 'home' : path.slice(1));
	const meta = $derived(
		site[key]?.seo ?? {
			title: `${site.contact.successTitle} | ${site.brand.name}`,
			description: site.contact.successCopy
		}
	);
	const canonical = $derived(`${origin}${path === '/' ? '/' : path}`);
	const socialImage = $derived(new URL(meta.image || site.brand.socialImage, origin).href);
	const noindex = $derived(
		preview || !['home', 'about', 'coaching', 'transformations', 'contact'].includes(key)
	);
	const schema = $derived(buildStructuredData(site, origin, path));
	const schemaScript = $derived(
		'<script type="application/ld+json">' + jsonLd(schema) + '</' + 'script>'
	);
</script>

<svelte:head>
	<title>{meta.title}</title>
	<meta name="description" content={meta.description} />
	<meta name="author" content={site.brand.founder} />
	<link rel="canonical" href={canonical} />
	<meta
		name="robots"
		content={noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}
	/>
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={site.brand.name} />
	<meta property="og:url" content={canonical} />
	<meta property="og:title" content={meta.title} />
	<meta property="og:description" content={meta.description} />
	<meta property="og:image" content={socialImage} />
	<meta property="og:image:alt" content={meta.imageAlt || site.brand.socialImageAlt} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={meta.title} />
	<meta name="twitter:description" content={meta.description} />
	<meta name="twitter:image" content={socialImage} />
	<meta name="twitter:image:alt" content={meta.imageAlt || site.brand.socialImageAlt} />
	<!-- jsonLd escapes HTML delimiters before embedding this structured data. -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html schemaScript}
</svelte:head>

import type { Content } from './schema';

export function jsonLd(value: unknown) {
	return JSON.stringify(value)
		.replace(/</g, '\\u003c')
		.replace(/>/g, '\\u003e')
		.replace(/&/g, '\\u0026')
		.replace(/\u2028/g, '\\u2028')
		.replace(/\u2029/g, '\\u2029');
}

export function buildStructuredData(site: Content, origin: string, path: string) {
	const organization = `${origin}/#organization`,
		person = `${origin}/#cash-fuerte`,
		website = `${origin}/#website`;
	const key = path === '/' ? 'home' : path.slice(1);
	const meta = site[key]?.seo ?? {
		title: site.contact.successTitle,
		description: site.contact.successCopy
	};
	const graph: Record<string, unknown>[] = [
		{
			'@type': 'Organization',
			'@id': organization,
			name: site.brand.name,
			url: `${origin}/`,
			description: site.home.hero.copy,
			email: site.brand.email,
			founder: { '@id': person },
			...(site.brand.logo ? { logo: new URL(site.brand.logo, origin).href } : {}),
			...(site.brand.socialLinks.length
				? { sameAs: site.brand.socialLinks.map((link: { href: string }) => link.href) }
				: {})
		},
		{
			'@type': 'Person',
			'@id': person,
			name: site.brand.founder,
			jobTitle: site.brand.role,
			description: site.brand.bio,
			worksFor: { '@id': organization },
			url: `${origin}/about`,
			...(site.brand.portrait ? { image: new URL(site.brand.portrait, origin).href } : {})
		},
		{
			'@type': 'WebSite',
			'@id': website,
			name: site.brand.name,
			url: `${origin}/`,
			publisher: { '@id': organization },
			inLanguage: 'en'
		},
		{
			'@type': path === '/about' ? 'AboutPage' : path === '/contact' ? 'ContactPage' : 'WebPage',
			'@id': `${origin}${path}#page`,
			url: `${origin}${path}`,
			name: meta.title,
			description: meta.description,
			isPartOf: { '@id': website },
			about: { '@id': organization },
			inLanguage: 'en'
		}
	];
	if (path !== '/')
		graph.push({
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: site.brand.name, item: `${origin}/` },
				{
					'@type': 'ListItem',
					position: 2,
					name: site[key]?.hero?.eyebrow || meta.title,
					item: `${origin}${path}`
				}
			]
		});
	if (path === '/coaching')
		for (const service of site.services)
			graph.push({
				'@type': 'Service',
				name: service.title,
				description: service.copy,
				provider: { '@id': organization },
				url: `${origin}/coaching`
			});
	if (path === '/' && site.faq.enabled && site.faq.items.length)
		graph.push({
			'@type': 'FAQPage',
			'@id': `${origin}/#faq`,
			mainEntity: site.faq.items.map((item: { question: string; answer: string }) => ({
				'@type': 'Question',
				name: item.question,
				acceptedAnswer: { '@type': 'Answer', text: item.answer }
			}))
		});
	return { '@context': 'https://schema.org', '@graph': graph };
}

export function xmlEscape(value: string) {
	return value.replace(
		/[<>&'"]/g,
		(character) =>
			({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[character]!
	);
}

export function llmsText(site: Content, origin: string) {
	const clean = (value: string) => value.replace(/[\r\n]+/g, ' ').trim();
	return `# ${clean(site.brand.name)}\n\n> ${clean(site.home.hero.copy)}\n\n## Key facts\n\n- Founder and coach: ${clean(site.brand.founder)}.\n- ${clean(site.brand.bio)}\n- Contact: ${clean(site.brand.email)}\n- Services: ${site.services.map((service: { title: string }) => clean(service.title)).join('; ')}\n\n## Pages\n\n${['home', 'about', 'coaching', 'transformations', 'contact'].map((key) => `- [${clean(site[key].seo.title)}](${origin}${key === 'home' ? '/' : '/' + key}): ${clean(site[key].seo.description)}`).join('\n')}\n${site.faq.enabled ? `\n## Questions and answers\n\n${site.faq.items.map((item: { question: string; answer: string }) => `### ${clean(item.question)}\n\n${clean(item.answer)}`).join('\n\n')}\n` : ''}`;
}

import { describe, expect, it } from 'vitest';
import {
	defaultWebsite,
	isSafeUrl,
	normalizeContent,
	validateWebsite,
	websiteSchema
} from './schema';
import { buildStructuredData, jsonLd, llmsText, xmlEscape } from './seo';
import { defaultSectionOrder, orderedHomeSections } from './home-sections';

describe('CMS content validation', () => {
	it('preserves a reordered homepage, restores legacy defaults, and rejects invalid orders', () => {
		const original = defaultWebsite();
		delete original.home.sectionOrder;
		const migrated = normalizeContent(websiteSchema, original) as ReturnType<typeof defaultWebsite>;
		expect(migrated.home.sectionOrder).toEqual(defaultSectionOrder);
		migrated.home.sectionOrder = [...defaultSectionOrder].reverse();
		expect(validateWebsite(migrated)).toEqual([]);
		expect(orderedHomeSections(migrated.home.sectionOrder)).toEqual(migrated.home.sectionOrder);
		for (const invalid of [
			[],
			[...defaultSectionOrder, 'hero'],
			['unknown', ...defaultSectionOrder.slice(1)]
		]) {
			migrated.home.sectionOrder = invalid;
			expect(validateWebsite(migrated)).toContain(
				'Home: include every homepage section exactly once in the section order.'
			);
		}
		expect(orderedHomeSections(['contact', 'unknown', 'contact'])).toEqual([
			'contact',
			...defaultSectionOrder.filter((id) => id !== 'contact')
		]);
	});
	it('accepts the complete Configains defaults and fills older documents safely', () => {
		expect(validateWebsite(defaultWebsite())).toEqual([]);
		const content = normalizeContent(websiteSchema, {
			brand: { name: 'Updated brand', portrait: 'javascript:alert(1)' },
			faq: null
		}) as ReturnType<typeof defaultWebsite>;
		expect(content.brand.name).toBe('Updated brand');
		expect(content.brand.portrait).toBe('');
		expect(validateWebsite(content)).toEqual([]);
	});
	it('rejects executable URLs, protocol relative URLs, and unsafe origins', () => {
		for (const url of [
			'javascript:alert(1)',
			'data:image/svg+xml,<svg>',
			'//evil.example/x',
			'/\\evil.example/x',
			'https://user:password@example.com/x'
		])
			expect(isSafeUrl(url)).toBe(false);
		expect(isSafeUrl('/images/coach.png')).toBe(true);
		expect(isSafeUrl('https://example.com/coach.png')).toBe(true);
		const content = defaultWebsite();
		content.brand.canonicalUrl = 'https://example.com/path';
		expect(validateWebsite(content)).toContain(
			'Public website URL must be an HTTPS origin without a path.'
		);
	});
	it('requires useful assessment options, FAQ answers and rotating headline words', () => {
		const content = defaultWebsite();
		content.contact.goal.options = [];
		content.home.hero.rotatingWords = [''];
		content.faq.items[0].answer = '';
		expect(validateWebsite(content).length).toBe(3);
	});
});

describe('Configains SEO and answer content', () => {
	it('escapes embedded JSON and XML without altering the original data', () => {
		const malicious = { name: '</script><script>alert(1)</script>&\u2028' };
		expect(jsonLd(malicious)).not.toContain('<');
		expect(JSON.parse(jsonLd(malicious))).toEqual(malicious);
		expect(xmlEscape('A&B<"')).toBe('A&amp;B&lt;&quot;');
	});
	it('uses published questions and omits FAQ schema when the visible section is disabled', () => {
		const content = defaultWebsite();
		content.faq.items = [{ question: 'How do I start?', answer: 'Send Cash your assessment.' }];
		const origin = content.brand.canonicalUrl;
		const schema = buildStructuredData(content, origin, '/');
		const faq = schema['@graph'].find((node) => node['@type'] === 'FAQPage');
		expect(faq?.mainEntity).toEqual([
			{
				'@type': 'Question',
				name: content.faq.items[0].question,
				acceptedAnswer: { '@type': 'Answer', text: content.faq.items[0].answer }
			}
		]);
		expect(llmsText(content, origin)).toContain('Cash Fuerte');
		expect(llmsText(content, origin)).toContain('Send Cash your assessment.');
		content.faq.enabled = false;
		expect(
			buildStructuredData(content, origin, '/')['@graph'].some(
				(node) => node['@type'] === 'FAQPage'
			)
		).toBe(false);
		expect(llmsText(content, origin)).not.toContain('Send Cash your assessment.');
	});
});

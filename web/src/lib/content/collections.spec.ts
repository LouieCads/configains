import { describe, expect, it } from 'vitest';
import {
	emptyValues,
	isCollectionName,
	validateCollectionItem,
	validateOrder,
	collections,
	MAX_REORDER_ITEMS
} from './collections';

const testimonial = { name: 'Alex', quote: 'Great coaching.', sort_order: 1, is_published: true };

describe('CMS item collections', () => {
	it('accepts only the editable collections', () => {
		expect(isCollectionName('testimonials')).toBe(true);
		expect(isCollectionName('transformations')).toBe(true);
		for (const name of ['site_content', 'admin_profiles', 'toString', ''])
			expect(isCollectionName(name)).toBe(false);
	});

	it('creates blank values matching each field type', () => {
		expect(emptyValues(collections.testimonials.fields)).toEqual({
			name: '',
			role: '',
			quote: '',
			image_url: '',
			image_alt: '',
			sort_order: 0,
			is_published: false
		});
	});

	it('points the admin list at real columns and keeps sort order out of the form', () => {
		for (const { fields, titleField, detailField, imageField } of Object.values(collections)) {
			const columns = fields.map(({ name }) => name);
			for (const column of [titleField, detailField, imageField].filter(Boolean))
				expect(columns).toContain(column);
			expect(fields.filter(({ hidden }) => hidden).map(({ name }) => name)).toEqual(['sort_order']);
		}
	});

	it('drops unknown columns and keeps valid values', () => {
		const result = validateCollectionItem('testimonials', {
			...testimonial,
			id: 'ignored',
			created_at: 'ignored'
		});
		expect(result).toEqual({ values: testimonial });
	});

	it.each([
		[{ name: 'Alex' }, 'Please fill in the required title or client name and quote.'],
		[
			{ ...testimonial, quote: '   ' },
			'Please fill in the required title or client name and quote.'
		],
		[{ ...testimonial, is_published: 'yes' }, 'Publication status must be on or off.'],
		[{ ...testimonial, sort_order: 1.5 }, 'Use a sort order between 0 and 10000.'],
		[{ ...testimonial, sort_order: -1 }, 'Use a sort order between 0 and 10000.'],
		[{ ...testimonial, role: 42 }, 'Content is invalid or too long.'],
		[
			{ ...testimonial, image_url: 'javascript:alert(1)' },
			'Image addresses must use HTTPS or a local path.'
		]
	])('rejects invalid input %#', (input, error) => {
		expect(validateCollectionItem('testimonials', input)).toEqual({ error });
	});
});

describe('display order', () => {
	it('accepts distinct item ids, including none', () => {
		expect(validateOrder(['a', 'b', 'c'])).toEqual({ order: ['a', 'b', 'c'] });
		expect(validateOrder([])).toEqual({ order: [] });
	});

	it.each([
		['not a list', 'a,b'],
		['missing', undefined],
		['a repeated id', ['a', 'b', 'a']],
		['an empty id', ['a', '']],
		['a non-text id', ['a', 2]],
		['an oversized id', ['x'.repeat(65)]],
		['too many ids', Array.from({ length: MAX_REORDER_ITEMS + 1 }, (_, index) => String(index))]
	])('rejects %s', (_, input) => {
		expect(validateOrder(input)).toEqual({ error: 'The new order is invalid.' });
	});
});

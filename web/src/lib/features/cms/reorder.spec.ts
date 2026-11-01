import { describe, expect, it } from 'vitest';
import { moveItem, numberedInOrder } from './reorder';

describe('moveItem', () => {
	it('moves an item later and earlier without changing the input', () => {
		const list = ['a', 'b', 'c', 'd'];
		expect(moveItem(list, 0, 2)).toEqual(['b', 'c', 'a', 'd']);
		expect(moveItem(list, 3, 1)).toEqual(['a', 'd', 'b', 'c']);
		expect(list).toEqual(['a', 'b', 'c', 'd']);
	});
});

describe('numberedInOrder', () => {
	const rows = [
		{ id: 'a', sort_order: 7 },
		{ id: 'b', sort_order: 7 },
		{ id: 'c', sort_order: 0 }
	];

	it('follows the given ids and renumbers from zero', () => {
		expect(numberedInOrder(rows, ['c', 'a', 'b'])).toEqual([
			{ id: 'c', sort_order: 0 },
			{ id: 'a', sort_order: 1 },
			{ id: 'b', sort_order: 2 }
		]);
	});

	it('keeps rows missing from the ids at the end in their own order', () => {
		expect(numberedInOrder(rows, ['b']).map((row) => row.id)).toEqual(['b', 'a', 'c']);
	});

	it('ignores ids that no row has', () => {
		expect(numberedInOrder(rows, ['x', 'b', 'a', 'c']).map((row) => row.id)).toEqual([
			'b',
			'a',
			'c'
		]);
	});
});

import { describe, expect, it } from 'vitest';
import { cleanText, isUuid } from './text';

describe('isUuid', () => {
	it('accepts a standard uuid and rejects anything else', () => {
		expect(isUuid('14000000-0000-0000-0000-000000000002')).toBe(true);
		expect(isUuid('not-a-uuid')).toBe(false);
		expect(isUuid(undefined)).toBe(false);
		expect(isUuid(['14000000-0000-0000-0000-000000000002'])).toBe(false);
	});
});

describe('cleanText', () => {
	it('trims and keeps text within the limit', () => {
		expect(cleanText('  Feeling strong  ', 50)).toBe('Feeling strong');
	});

	it('rejects blank, overlong and non-string input', () => {
		expect(cleanText('   ', 50)).toBeNull();
		expect(cleanText('x'.repeat(51), 50)).toBeNull();
		expect(cleanText(42, 50)).toBeNull();
	});
});

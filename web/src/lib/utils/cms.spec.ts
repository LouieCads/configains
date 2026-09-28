import { describe, expect, it } from 'vitest';
import { isCmsCollection } from './cms';

describe('isCmsCollection', () => {
	it('accepts supported collections', () => {
		expect(isCmsCollection('site_content')).toBe(true);
		expect(isCmsCollection('testimonials')).toBe(true);
		expect(isCmsCollection('transformations')).toBe(true);
	});

	it('rejects unsupported tables', () => {
		expect(isCmsCollection('admin_profiles')).toBe(false);
	});
});

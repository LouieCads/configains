import type { CmsCollection } from '$lib/types/cms';

export const cmsCollections: readonly CmsCollection[] = [
	'site_content',
	'testimonials',
	'transformations'
];

export function isCmsCollection(value: string): value is CmsCollection {
	return cmsCollections.includes(value as CmsCollection);
}

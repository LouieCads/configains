export const homeSections = [
	{ id: 'hero', label: 'Hero' },
	{ id: 'principles', label: 'Principles strip' },
	{ id: 'about', label: 'Coach introduction' },
	{ id: 'coaching', label: 'Coaching services' },
	{ id: 'transformations', label: 'Transformation carousel' },
	{ id: 'testimonials', label: 'Testimonials' },
	{ id: 'products', label: 'Products' },
	{ id: 'app', label: 'App' },
	{ id: 'faq', label: 'FAQ' },
	{ id: 'contact', label: 'Contact' }
] as const;
export type HomeSectionId = (typeof homeSections)[number]['id'];
export const defaultSectionOrder = homeSections.map(({ id }) => id);

// Preserve saved order while safely filling sections missing from older documents.
export function orderedHomeSections(value: unknown): HomeSectionId[] {
	const saved = Array.isArray(value) ? value : [];
	return [...new Set([...saved, ...defaultSectionOrder])].filter((id): id is HomeSectionId =>
		defaultSectionOrder.includes(id)
	);
}

export function validSectionOrder(value: unknown): boolean {
	return (
		Array.isArray(value) &&
		value.length === defaultSectionOrder.length &&
		new Set(value).size === value.length &&
		value.every((id) => defaultSectionOrder.includes(id))
	);
}

import type { Field } from '$lib/content/schema';

type PanelDefinition = { label: string; paths: string[] };
export type EditorPanel = {
	id: string;
	label: string;
	fields: { path: string[]; field: Field }[];
};

const panel = (label: string, ...paths: string[]): PanelDefinition => ({ label, paths });
const layouts: Record<string, PanelDefinition[]> = {
	brand: [
		panel('Identity', 'name', 'wordmark', 'tagline'),
		panel('Coach', 'founder', 'role', 'bio', 'portrait', 'portraitAlt', 'portraitPlaceholder'),
		panel('Brand assets', 'logo', 'logoAlt', 'favicon'),
		panel('Contact and profiles', 'email', 'socialLinks'),
		panel('Search and sharing', 'canonicalUrl', 'socialImage', 'socialImageAlt')
	],
	navigation: [
		panel('Navigation links', 'items'),
		panel('Header labels', 'contactLabel', 'menuOpen', 'menuClose', 'skipLabel'),
		panel('Footer', 'backToTop', 'footerNote', 'contactLink', 'appLink')
	],
	home: [
		panel(
			'Hero',
			'hero.firstLine',
			'hero.secondLine',
			'hero.rotatingWords',
			'hero.copy',
			'hero.cta',
			'hero.explore'
		),
		panel(
			'Hero visual',
			'hero.visualLabel',
			'hero.visualTitle',
			'hero.image',
			'hero.imageAlt',
			'hero.principles'
		),
		panel('Coach introduction', 'about'),
		panel('Coaching', 'coaching'),
		panel(
			'Transformations',
			'proof.eyebrow',
			'proof.heading',
			'proof.placeholderTitles',
			'proof.placeholderCopy',
			'proof.photoPlaceholder',
			'proof.before',
			'proof.after',
			'proof.journey',
			'proof.comingSoon'
		),
		panel(
			'Testimonials',
			'proof.testimonialEyebrow',
			'proof.testimonialHeading',
			'proof.testimonialPlaceholder',
			'proof.testimonialStatus',
			'proof.testimonialHint'
		),
		panel('Products', 'products'),
		panel('App', 'app'),
		panel('Contact', 'contact'),
		panel('Section order', 'sectionOrder'),
		panel('SEO', 'seo')
	],
	about: [panel('Introduction', 'hero', 'cta'), panel('Story', 'sections'), panel('SEO', 'seo')],
	coaching: [
		panel('Introduction', 'hero'),
		panel('Next steps', 'closingTitle', 'closingCopy', 'cta'),
		panel('SEO', 'seo')
	],
	transformations: [panel('Introduction', 'hero', 'empty'), panel('SEO', 'seo')],
	faq: [panel('Section settings', 'enabled', 'eyebrow', 'heading'), panel('Questions', 'items')],
	contact: [
		panel('Introduction', 'hero', 'intro', 'back'),
		panel('Next steps', 'steps'),
		panel('Personal details', 'sectionOne', 'nameLabel', 'emailLabel', 'emailHelp', 'goal'),
		panel(
			'Training',
			'sectionTwo',
			'trainingExperience',
			'fitnessKnowledge',
			'trainingDays',
			'trainingLocation'
		),
		panel('Nutrition', 'sectionThree', 'nutritionKnowledge', 'nutritionExperience'),
		panel(
			'Additional context',
			'challengeLabel',
			'challengePlaceholder',
			'contextLabel',
			'contextPlaceholder',
			'optionalLabel'
		),
		panel('Privacy and consent', 'privacy', 'consent'),
		panel('Submission', 'submit', 'submitting', 'sendingNote', 'previewError', 'error'),
		panel('Success message', 'successEyebrow', 'successTitle', 'successCopy'),
		panel('SEO', 'seo')
	]
};

function leaves(field: Field, path: string[] = []): string[][] {
	return field.kind === 'group'
		? Object.entries(field.fields ?? {}).flatMap(([key, child]) => leaves(child, [...path, key]))
		: [path];
}

export function editorPanels(section: string, field: Field): EditorPanel[] {
	const definitions = layouts[section] ?? [panel(field.label, '')];
	const panels = definitions.map(({ label, paths }, index) => ({
		id: `${section}-${index}`,
		label,
		fields: paths.map((value) => {
			const path = value ? value.split('.') : [];
			let child = field;
			for (const key of path) {
				const next = child.fields?.[key];
				if (!next) throw new Error(`Unknown CMS field: ${section}.${value}`);
				child = next;
			}
			return { path, field: child };
		})
	}));
	const assigned = panels.flatMap(({ fields }) => fields.map(({ path }) => path));
	const remaining = leaves(field).filter(
		(path) => !assigned.some((parent) => parent.every((key, index) => path[index] === key))
	);
	// Keep new schema fields editable even before a dedicated tab is added.
	if (remaining.length) {
		panels.push({
			id: `${section}-other`,
			label: 'Other settings',
			fields: remaining.map((path) => ({
				path,
				field: path.reduce((child, key) => child.fields![key], field)
			}))
		});
	}
	return panels;
}

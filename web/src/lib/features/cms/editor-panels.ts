/**
 * Tab layout for each top-level website section in the content editor.
 *
 * Each tab lists dot-separated paths relative to its section; a group path
 * includes all of its children. Any field not assigned to a tab is appended
 * to an "Other settings" tab, so new schema fields are never hidden.
 */
import type { Field } from '$lib/content/schema';
import { homeSections, type HomeSectionId } from '$lib/content/home-sections';

type PanelGroup = 'content' | 'settings';
type PanelDefinition = {
	label: string;
	paths: string[];
	group: PanelGroup;
	/** Homepage section this tab edits; the editor orders these tabs like the homepage. */
	homeSection?: HomeSectionId;
	/** Website section that holds this tab's fields instead (the tab links there). */
	linkTo?: string;
};
export type EditorPanel = Omit<PanelDefinition, 'paths'> & {
	id: string;
	fields: { path: string[]; field: Field }[];
};

const panel = (label: string, ...paths: string[]): PanelDefinition => ({
	label,
	paths,
	group: 'content'
});
/** A homepage tab, labelled like the section in the section order list. */
const homePanel = (homeSection: HomeSectionId, ...paths: string[]): PanelDefinition => ({
	label: homeSections.find((section) => section.id === homeSection)!.label,
	paths,
	group: 'content',
	homeSection
});
/** Page-level settings (SEO, section order) rather than a homepage section — kept visually separate in the tabs. */
const settingsPanel = (label: string, ...paths: string[]): PanelDefinition => ({
	label,
	paths,
	group: 'settings'
});
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
		homePanel(
			'hero',
			'hero.firstLine',
			'hero.secondLine',
			'hero.rotatingWords',
			'hero.copy',
			'hero.cta',
			'hero.explore',
			'hero.visualTitle',
			'hero.image',
			'hero.imageAlt'
		),
		homePanel('principles', 'hero.principles'),
		homePanel('about', 'about'),
		homePanel('coaching', 'coaching'),
		homePanel(
			'transformations',
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
		homePanel(
			'testimonials',
			'proof.testimonialEyebrow',
			'proof.testimonialHeading',
			'proof.testimonialPlaceholder',
			'proof.testimonialStatus',
			'proof.testimonialHint'
		),
		homePanel('products', 'products'),
		homePanel('app', 'app'),
		{ ...homePanel('faq'), linkTo: 'faq' },
		homePanel('contact', 'contact'),
		settingsPanel('Section order', 'sectionOrder'),
		settingsPanel('SEO', 'seo')
	],
	about: [
		panel('Introduction', 'hero', 'cta'),
		panel('Story', 'sections'),
		settingsPanel('SEO', 'seo')
	],
	coaching: [
		panel('Introduction', 'hero'),
		panel('Next steps', 'closingTitle', 'closingCopy', 'cta'),
		settingsPanel('SEO', 'seo')
	],
	transformations: [panel('Introduction', 'hero', 'empty'), settingsPanel('SEO', 'seo')],
	faq: [panel('Section settings', 'enabled', 'eyebrow', 'heading'), panel('Questions', 'items')],
	contact: [
		panel('Introduction', 'back'),
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
		panel('Step-by-step form', 'flow'),
		panel('Submission', 'submit', 'submitting', 'sendingNote', 'previewError', 'error'),
		panel('Success message', 'successEyebrow', 'successTitle', 'successCopy'),
		settingsPanel('SEO', 'seo')
	]
};

/** Paths of every non-group field beneath `field`. */
function leaves(field: Field, path: string[] = []): string[][] {
	return field.kind === 'group'
		? Object.entries(field.fields ?? {}).flatMap(([key, child]) => leaves(child, [...path, key]))
		: [path];
}

/**
 * Resolves the tabs for `section`. Sections without a layout get a single tab.
 * Throws if a layout names a field missing from the schema.
 */
export function editorPanels(section: string, field: Field): EditorPanel[] {
	const definitions = layouts[section] ?? [panel(field.label, '')];
	const panels: EditorPanel[] = definitions.map(({ paths, ...definition }, index) => ({
		...definition,
		id: `${section}-${index}`,
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
			group: 'content',
			fields: remaining.map((path) => ({
				path,
				field: path.reduce((child, key) => child.fields![key], field)
			}))
		});
	}
	return panels;
}

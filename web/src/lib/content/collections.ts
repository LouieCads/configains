/**
 * Item collections (testimonials and transformations).
 *
 * Unlike the website document, these rows publish individually through their
 * `is_published` flag. Each definition is the single source of truth for both
 * the admin form and the API allowlist: to make a new column editable, add a
 * migration and list the column here.
 */
import { isSafeUrl, MAX_TEXTAREA_LENGTH } from './schema';

export type CollectionFieldType = 'text' | 'textarea' | 'number' | 'checkbox' | 'image';

export type CollectionField = {
	/** Database column name. */
	name: string;
	label: string;
	type: CollectionFieldType;
	required?: boolean;
};

export type CollectionDefinition = {
	/** Singular, human-readable item name used in dialogs. */
	itemLabel: string;
	fields: readonly CollectionField[];
};

/** A stored collection row. Columns beyond `id` depend on the collection. */
export type CollectionRow = Record<string, unknown> & { id: string };

export const MAX_SORT_ORDER = 10000;

const field = (
	name: string,
	label: string,
	type: CollectionFieldType = 'text',
	required = false
): CollectionField => ({ name, label, type, required });

const sortOrder = field('sort_order', 'Sort order', 'number');
const published = field('is_published', 'Published', 'checkbox');

export const collections = {
	testimonials: {
		itemLabel: 'testimonial',
		fields: [
			field('name', 'Client name', 'text', true),
			field('role', 'Role or result'),
			field('quote', 'Quote', 'textarea', true),
			field('image_url', 'Client photo', 'image'),
			field('image_alt', 'Photo description'),
			sortOrder,
			published
		]
	},
	transformations: {
		itemLabel: 'transformation',
		fields: [
			field('title', 'Title', 'text', true),
			field('summary', 'Summary', 'textarea'),
			field('story', 'Full story', 'textarea'),
			field('before_image_url', 'Before photo', 'image'),
			field('before_image_alt', 'Before photo description'),
			field('after_image_url', 'After photo', 'image'),
			field('after_image_alt', 'After photo description'),
			sortOrder,
			published
		]
	}
} as const satisfies Record<string, CollectionDefinition>;

export type CollectionName = keyof typeof collections;

export function isCollectionName(value: string): value is CollectionName {
	return Object.hasOwn(collections, value);
}

/** Blank form values for a new item, keyed by column name. */
export function emptyValues(fields: readonly CollectionField[]): Record<string, unknown> {
	return Object.fromEntries(
		fields.map(({ name, type }) => [name, type === 'checkbox' ? false : type === 'number' ? 0 : ''])
	);
}

/**
 * Keeps only the collection's editable columns and checks their values.
 * Returns the sanitized payload or the first user-facing error message.
 */
export function validateCollectionItem(
	name: CollectionName,
	input: Record<string, unknown>
): { values: Record<string, unknown> } | { error: string } {
	const values: Record<string, unknown> = {};
	for (const { name: column, type, required } of collections[name].fields) {
		if (!(column in input)) {
			if (required) return { error: 'Please fill in the required title or client name and quote.' };
			continue;
		}
		const value = input[column];
		if (type === 'checkbox') {
			if (typeof value !== 'boolean') return { error: 'Publication status must be on or off.' };
		} else if (type === 'number') {
			if (
				!Number.isSafeInteger(value) ||
				(value as number) < 0 ||
				(value as number) > MAX_SORT_ORDER
			)
				return { error: `Use a sort order between 0 and ${MAX_SORT_ORDER}.` };
		} else {
			if (typeof value !== 'string' || value.length > MAX_TEXTAREA_LENGTH)
				return { error: 'Content is invalid or too long.' };
			if (type === 'image' && value && !isSafeUrl(value))
				return { error: 'Image addresses must use HTTPS or a local path.' };
			if (required && !value.trim())
				return { error: 'Please fill in the required title or client name and quote.' };
		}
		values[column] = value;
	}
	return { values };
}

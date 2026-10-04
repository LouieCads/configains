import { describe, expect, it } from 'vitest';
import { websiteSchema, type Field } from '$lib/content/schema';
import { editorPanels } from './editor-panels';

function editablePaths(field: Field, path: string[] = []): string[] {
	return field.kind === 'group'
		? Object.entries(field.fields ?? {}).flatMap(([key, child]) =>
				editablePaths(child, [...path, key])
			)
		: [path.join('.')];
}

describe('CMS section tabs', () => {
	it('keeps every website field accessible exactly once across the tabs', () => {
		for (const [section, field] of Object.entries(websiteSchema.fields!)) {
			const panels = editorPanels(section, field);
			const paths = panels.flatMap((panel) =>
				panel.fields.flatMap((entry) => editablePaths(entry.field, entry.path))
			);
			expect(paths.toSorted(), section).toEqual(editablePaths(field).toSorted());
			expect(
				panels.some((panel) => panel.id.endsWith('-other')),
				section
			).toBe(false);
		}
	});

	it('exposes newly added content fields until a dedicated tab is assigned', () => {
		const field = structuredClone(websiteSchema.fields!.home);
		field.fields!.hero.fields!.announcement = { kind: 'text', label: 'Announcement' };
		const panels = editorPanels('home', field);
		expect(panels.at(-1)?.fields.map((entry) => entry.path)).toEqual([['hero', 'announcement']]);
	});
});

import { describe, expect, it } from 'vitest';
import {
	DRAFT_MAX_AGE_MS,
	clearDraft,
	loadDraft,
	saveDraft,
	type Draft,
	type DraftStorage
} from './draft';

function memoryStorage(initial: Record<string, string> = {}): DraftStorage & {
	data: Record<string, string>;
} {
	const data = { ...initial };
	return {
		data,
		getItem: (key) => data[key] ?? null,
		setItem: (key, value) => {
			data[key] = value;
		},
		removeItem: (key) => {
			delete data[key];
		}
	};
}

const draft: Draft = { v: 1, savedAt: 1_000, step: 2, reached: 2, values: { name: 'Ana' } };

describe('form drafts', () => {
	it('saves and loads a draft', () => {
		const storage = memoryStorage();
		expect(saveDraft(storage, 'k', draft)).toBe(true);
		expect(loadDraft(storage, 'k', 2_000)).toEqual(draft);
	});

	it('ignores and removes a draft older than the limit', () => {
		const storage = memoryStorage();
		saveDraft(storage, 'k', draft);
		expect(loadDraft(storage, 'k', draft.savedAt + DRAFT_MAX_AGE_MS + 1)).toBeNull();
		expect(storage.data.k).toBeUndefined();
	});

	it('rejects damaged or unknown-version drafts', () => {
		for (const raw of [
			'not json',
			'null',
			JSON.stringify({ ...draft, v: 2 }),
			JSON.stringify({ ...draft, step: -1 }),
			JSON.stringify({ ...draft, step: 1.5 }),
			JSON.stringify({ ...draft, values: { name: 5 } }),
			JSON.stringify({ ...draft, values: ['a'] })
		]) {
			expect(loadDraft(memoryStorage({ k: raw }), 'k', 2_000)).toBeNull();
		}
	});

	it('clears a draft', () => {
		const storage = memoryStorage();
		saveDraft(storage, 'k', draft);
		clearDraft(storage, 'k');
		expect(loadDraft(storage, 'k', 2_000)).toBeNull();
	});

	it('keeps working when storage is missing or throws', () => {
		const blocked: DraftStorage = {
			getItem: () => {
				throw new Error('blocked');
			},
			setItem: () => {
				throw new Error('full');
			},
			removeItem: () => {
				throw new Error('blocked');
			}
		};
		expect(loadDraft(null, 'k')).toBeNull();
		expect(saveDraft(null, 'k', draft)).toBe(false);
		expect(loadDraft(blocked, 'k')).toBeNull();
		expect(saveDraft(blocked, 'k', draft)).toBe(false);
		expect(() => clearDraft(blocked, 'k')).not.toThrow();
		expect(() => clearDraft(null, 'k')).not.toThrow();
	});
});

/**
 * Browser-side form drafts.
 *
 * A draft lives only in the visitor's own browser storage. It is never sent to
 * the server, so nobody else can read it. It expires after `DRAFT_MAX_AGE_MS`
 * and callers remove it as soon as the form is sent. Every storage call is
 * wrapped because storage can be blocked, full, or missing (private windows,
 * server rendering), and a form must keep working without it.
 */

export const DRAFT_VERSION = 1;
/** Drafts older than this are ignored and removed. */
export const DRAFT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export type Draft = {
	v: typeof DRAFT_VERSION;
	/** Epoch milliseconds of the last save. */
	savedAt: number;
	/** Zero-based step the visitor was on. */
	step: number;
	/** Furthest zero-based step the visitor has completed. */
	reached: number;
	values: Record<string, string>;
};

/** The slice of the Web Storage API drafts need. */
export type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** The browser's local storage, or `null` where it is missing or blocked. */
export function browserStorage(): DraftStorage | null {
	try {
		return typeof localStorage === 'undefined' ? null : localStorage;
	} catch {
		return null;
	}
}

function isDraft(value: unknown): value is Draft {
	if (!value || typeof value !== 'object') return false;
	const draft = value as Record<string, unknown>;
	if (draft.v !== DRAFT_VERSION) return false;
	if (typeof draft.savedAt !== 'number' || !Number.isFinite(draft.savedAt)) return false;
	if (!Number.isInteger(draft.step) || (draft.step as number) < 0) return false;
	if (!Number.isInteger(draft.reached) || (draft.reached as number) < 0) return false;
	const values = draft.values;
	return (
		!!values &&
		typeof values === 'object' &&
		!Array.isArray(values) &&
		Object.values(values).every((entry) => typeof entry === 'string')
	);
}

/** Reads a draft; returns `null` when none exists, it is expired, or it is damaged. */
export function loadDraft(
	storage: DraftStorage | null,
	key: string,
	now = Date.now()
): Draft | null {
	if (!storage) return null;
	try {
		const raw = storage.getItem(key);
		if (!raw) return null;
		const parsed: unknown = JSON.parse(raw);
		if (!isDraft(parsed) || now - parsed.savedAt > DRAFT_MAX_AGE_MS) {
			storage.removeItem(key);
			return null;
		}
		return parsed;
	} catch {
		return null;
	}
}

/** Writes a draft; returns whether it was stored. */
export function saveDraft(storage: DraftStorage | null, key: string, draft: Draft): boolean {
	if (!storage) return false;
	try {
		storage.setItem(key, JSON.stringify(draft));
		return true;
	} catch {
		return false;
	}
}

export function clearDraft(storage: DraftStorage | null, key: string): void {
	try {
		storage?.removeItem(key);
	} catch {
		// Nothing to remove, or storage is blocked.
	}
}

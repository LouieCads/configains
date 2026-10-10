// Browser storage for offline logging. Pure outbox rules live in $lib/coaching/outbox.ts.
// The program cache holds the client's own plan, so signing out clears it along with the outbox.
import type { OutboxRecord, OutboxStore } from '$lib/coaching/outbox';
import type { SyncItem, SyncResult } from '$lib/coaching/sync';

const databaseName = 'configains-offline';
const databaseVersion = 1;

function request<T>(req: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

export function openOffline(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const open = indexedDB.open(databaseName, databaseVersion);
		open.onupgradeneeded = () => {
			const db = open.result;
			if (!db.objectStoreNames.contains('outbox'))
				db.createObjectStore('outbox', { keyPath: 'id' });
			if (!db.objectStoreNames.contains('program'))
				db.createObjectStore('program', { keyPath: 'key' });
		};
		open.onsuccess = () => resolve(open.result);
		open.onerror = () => reject(open.error);
	});
}

export function outboxStore(db: IDBDatabase): OutboxStore {
	const store = (mode: IDBTransactionMode) => db.transaction('outbox', mode).objectStore('outbox');
	return {
		async list() {
			return (await request(store('readonly').getAll())) as OutboxRecord[];
		},
		async put(record) {
			// The item id is the key, so a retry can never create a second copy of the same entry.
			await request(store('readwrite').put({ ...record, id: record.item.id }));
		},
		async remove(id) {
			await request(store('readwrite').delete(id));
		}
	};
}

export async function cacheProgram(db: IDBDatabase, program: unknown) {
	const tx = db.transaction('program', 'readwrite');
	await request(
		tx.objectStore('program').put({ key: 'current', program, savedAt: new Date().toISOString() })
	);
}

export async function readCachedProgram(
	db: IDBDatabase
): Promise<{ program: unknown; savedAt: string } | null> {
	const row = await request(
		db.transaction('program', 'readonly').objectStore('program').get('current')
	);
	return row ? { program: row.program, savedAt: row.savedAt } : null;
}

/** Removes the cached program and every queued entry from this device. Used on sign-out. */
export async function clearLocalData(db: IDBDatabase) {
	const tx = db.transaction(['outbox', 'program'], 'readwrite');
	tx.objectStore('outbox').clear();
	tx.objectStore('program').clear();
	await new Promise<void>((resolve, reject) => {
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
		tx.onabort = () => reject(tx.error);
	});
}

export async function sendBatch(items: SyncItem[]): Promise<SyncResult[]> {
	const response = await fetch('/api/coaching/sync', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ items })
	});
	if (!response.ok) throw new Error(`Sync failed with status ${response.status}.`);
	const body = (await response.json()) as { results: SyncResult[] };
	return body.results;
}

/** Returns the live program, or null with `signedOut` set when the session has ended. */
export async function fetchProgram(): Promise<{ program: unknown; signedOut: boolean }> {
	const response = await fetch('/api/coaching/program');
	if (response.status === 401 || response.status === 403) return { program: null, signedOut: true };
	if (!response.ok) throw new Error(`Program request failed with status ${response.status}.`);
	const body = (await response.json()) as { program: unknown };
	return { program: body.program, signedOut: false };
}

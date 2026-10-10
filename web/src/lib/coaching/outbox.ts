import type { SyncItem, SyncResult } from './sync';

export type OutboxRecord = {
	item: SyncItem;
	status: 'pending' | 'rejected';
	message?: string;
	queuedAt: string;
};

/** Storage behind the outbox. The browser build uses IndexedDB; tests use memory. */
export type OutboxStore = {
	list(): Promise<OutboxRecord[]>;
	put(record: OutboxRecord): Promise<void>;
	remove(id: string): Promise<void>;
};

export type FlushResult =
	| { offline: true; synced: 0; rejected: number; pending: number }
	| { offline: false; synced: number; rejected: number; pending: number };

export const batchSize = 50;

export async function enqueue(store: OutboxStore, item: SyncItem, queuedAt: string) {
	await store.put({ item, status: 'pending', queuedAt });
}

/**
 * Sends pending items to the server and records the outcome.
 * Saved and duplicate items leave the outbox. Rejected items stay with the reason shown to the client.
 * If the send fails (offline or server error), nothing is removed, so the next attempt retries them.
 */
export async function flush(
	store: OutboxStore,
	send: (items: SyncItem[]) => Promise<SyncResult[]>
): Promise<FlushResult> {
	const records = await store.list();
	const pending = records.filter((record) => record.status === 'pending').slice(0, batchSize);
	const countRejected = () => records.filter((record) => record.status === 'rejected').length;
	const countPending = () => records.filter((record) => record.status === 'pending').length;

	if (pending.length === 0)
		return { offline: false, synced: 0, rejected: countRejected(), pending: countPending() };

	let results: SyncResult[];
	try {
		results = await send(pending.map((record) => record.item));
	} catch {
		return { offline: true, synced: 0, rejected: countRejected(), pending: countPending() };
	}

	let synced = 0;
	const byId = new Map(pending.map((record) => [record.item.id, record]));
	for (const result of results) {
		const record = byId.get(result.id);
		if (!record) continue;
		if (result.status === 'saved' || result.status === 'duplicate') {
			await store.remove(result.id);
			synced++;
		} else {
			await store.put({
				...record,
				status: 'rejected',
				message: result.message ?? 'The server did not accept this entry.'
			});
		}
	}

	const after = await store.list();
	return {
		offline: false,
		synced,
		rejected: after.filter((record) => record.status === 'rejected').length,
		pending: after.filter((record) => record.status === 'pending').length
	};
}

import { describe, expect, it } from 'vitest';
import { enqueue, flush, type OutboxRecord, type OutboxStore } from './outbox';
import type { SyncItem } from './sync';

function memoryStore(): OutboxStore & { records: Map<string, OutboxRecord> } {
	const records = new Map<string, OutboxRecord>();
	return {
		records,
		async list() {
			return [...records.values()];
		},
		async put(record) {
			records.set(record.item.id, record);
		},
		async remove(id) {
			records.delete(id);
		}
	};
}

const metric = (id: string): SyncItem => ({
	kind: 'metric',
	id,
	metric: 'waist_cm',
	value: 80,
	measured_on: '2026-10-10'
});

describe('outbox flush', () => {
	it('removes items the server saved or already had', async () => {
		const store = memoryStore();
		await enqueue(store, metric('a'), '2026-10-10T08:00:00Z');
		await enqueue(store, metric('b'), '2026-10-10T08:01:00Z');

		const result = await flush(store, async (items) =>
			items.map((item) => ({ id: item.id, status: item.id === 'a' ? 'saved' : 'duplicate' }))
		);

		expect(result).toEqual({ offline: false, synced: 2, rejected: 0, pending: 0 });
		expect(store.records.size).toBe(0);
	});

	it('keeps a rejected item with its reason instead of dropping it', async () => {
		const store = memoryStore();
		await enqueue(store, metric('a'), '2026-10-10T08:00:00Z');

		const result = await flush(store, async () => [
			{ id: 'a', status: 'rejected', message: 'Waist must be between 30 and 200 cm.' }
		]);

		expect(result).toEqual({ offline: false, synced: 0, rejected: 1, pending: 0 });
		expect(store.records.get('a')).toMatchObject({
			status: 'rejected',
			message: 'Waist must be between 30 and 200 cm.'
		});
	});

	it('leaves everything queued when offline, so the next attempt retries', async () => {
		const store = memoryStore();
		await enqueue(store, metric('a'), '2026-10-10T08:00:00Z');

		const result = await flush(store, async () => {
			throw new TypeError('Failed to fetch');
		});

		expect(result).toEqual({ offline: true, synced: 0, rejected: 0, pending: 1 });
		expect(store.records.get('a')?.status).toBe('pending');
	});

	it('does not send rejected items again', async () => {
		const store = memoryStore();
		store.records.set('a', {
			item: metric('a'),
			status: 'rejected',
			message: 'bad',
			queuedAt: 'x'
		});
		let sent = 0;

		await flush(store, async (items) => {
			sent += items.length;
			return [];
		});

		expect(sent).toBe(0);
	});
});

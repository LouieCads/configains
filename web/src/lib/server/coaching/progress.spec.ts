import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { noTargets } from '$lib/coaching/targets';
import type { SyncItem } from '$lib/coaching/sync';
import { loadTargets, saveSyncItems, saveTargets } from './progress';

const clientId = '18000000-0000-0000-0000-000000000001';
const itemId = '18100000-0000-0000-0000-000000000001';

/** Records what is written to each table. */
function recorder(result: { error: { code?: string; message: string } | null } = { error: null }) {
	const inserts: { table: string; row: unknown }[] = [];
	const upserts: { table: string; row: unknown; options: unknown }[] = [];
	const supabase = {
		from: (table: string) => ({
			insert: async (row: unknown) => {
				inserts.push({ table, row });
				return result;
			},
			upsert: async (row: unknown, options: unknown) => {
				upserts.push({ table, row, options });
				return result;
			}
		})
	} as unknown as SupabaseClient;
	return { supabase, inserts, upserts };
}

describe('saving step and cardio entries', () => {
	const steps: SyncItem = { kind: 'steps', id: itemId, logged_on: '2026-11-10', steps: 8123 };
	const cardio: SyncItem = {
		kind: 'cardio',
		id: itemId,
		logged_on: '2026-11-10',
		duration_minutes: 32,
		avg_heart_rate: 145,
		activity: 'Bike'
	};

	it('inserts a step count for the signed-in client only', async () => {
		const { supabase, inserts } = recorder();
		const results = await saveSyncItems(supabase, clientId, null, new Set(), [steps]);
		expect(results).toEqual([{ id: itemId, status: 'saved' }]);
		expect(inserts).toEqual([
			{
				table: 'step_logs',
				row: { id: itemId, client_id: clientId, logged_on: '2026-11-10', steps: 8123 }
			}
		]);
	});

	it('inserts a cardio session with its heart rate and activity', async () => {
		const { supabase, inserts } = recorder();
		await saveSyncItems(supabase, clientId, null, new Set(), [cardio]);
		expect(inserts).toEqual([
			{
				table: 'cardio_logs',
				row: {
					id: itemId,
					client_id: clientId,
					logged_on: '2026-11-10',
					duration_minutes: 32,
					avg_heart_rate: 145,
					activity: 'Bike'
				}
			}
		]);
	});

	it('treats a repeated id as already saved, so a retry is harmless', async () => {
		const { supabase } = recorder({ error: { code: '23505', message: 'duplicate key' } });
		expect(await saveSyncItems(supabase, clientId, null, new Set(), [steps])).toEqual([
			{ id: itemId, status: 'duplicate' }
		]);
	});

	it('rejects an entry the database refuses on a constraint', async () => {
		const { supabase } = recorder({ error: { code: '23514', message: 'check violation' } });
		const [result] = await saveSyncItems(supabase, clientId, null, new Set(), [cardio]);
		expect(result.status).toBe('rejected');
	});
});

describe('saving targets', () => {
	it('upserts only the given fields, keyed on the client', async () => {
		const { supabase, upserts } = recorder();
		const result = await saveTargets(supabase, clientId, { daily_steps_target: 8000 });
		expect(result).toEqual({ ok: true });
		expect(upserts).toEqual([
			{
				table: 'client_targets',
				row: { client_id: clientId, daily_steps_target: 8000 },
				options: { onConflict: 'client_id' }
			}
		]);
	});

	it('explains a failure without exposing the database message', async () => {
		const { supabase } = recorder({ error: { code: '42501', message: 'secret internals' } });
		const result = await saveTargets(supabase, clientId, { calories_kcal: 2030 });
		expect(result).toMatchObject({ ok: false });
		expect(JSON.stringify(result)).not.toContain('secret');
	});

	it('says so when the client does not exist', async () => {
		const { supabase } = recorder({ error: { code: '23503', message: 'fk' } });
		expect(await saveTargets(supabase, clientId, {})).toEqual({
			ok: false,
			message: 'Client not found.'
		});
	});
});

describe('loading targets', () => {
	const supabaseReturning = (data: unknown, error: unknown = null) =>
		({
			from: () => ({
				select: () => ({ eq: () => ({ maybeSingle: async () => ({ data, error }) }) })
			})
		}) as unknown as SupabaseClient;

	it('returns every field even when no row exists yet', async () => {
		expect(await loadTargets(supabaseReturning(null), clientId)).toEqual(noTargets);
	});

	it('returns the stored targets', async () => {
		const targets = await loadTargets(
			supabaseReturning({ daily_steps_target: 8000, nutrition_notes: ['Eat slowly.'] }),
			clientId
		);
		expect(targets.daily_steps_target).toBe(8000);
		expect(targets.nutrition_notes).toEqual(['Eat slowly.']);
		expect(targets.cardio_minutes).toBeNull();
	});

	it('throws when the read fails, so a caller cannot mistake it for no targets', async () => {
		await expect(
			loadTargets(supabaseReturning(null, { code: '500', message: 'boom' }), clientId)
		).rejects.toMatchObject({ code: '500' });
	});
});

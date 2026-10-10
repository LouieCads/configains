import { error, json, type RequestHandler } from '@sveltejs/kit';
import { batchSize } from '$lib/coaching/outbox';
import { validateSyncItem, type SyncItem, type SyncResult } from '$lib/coaching/sync';
import { requireClient } from '$lib/server/auth/client';
import { requireSameOrigin } from '$lib/server/auth/origin';
import { loadActiveProgram } from '$lib/server/coaching/templates';
import { saveSyncItems } from '$lib/server/coaching/progress';

/** Accepts a batch from the offline outbox. Each item is checked, then saved or rejected on its own. */
export const POST: RequestHandler = async (event) => {
	requireSameOrigin(event);
	const { user } = await requireClient(event);

	const body = (await event.request.json().catch(() => null)) as { items?: unknown } | null;
	const rawItems = Array.isArray(body?.items) ? body.items : null;
	if (!rawItems || rawItems.length === 0 || rawItems.length > batchSize)
		error(400, `Send between 1 and ${batchSize} items.`);

	const today = new Date().toISOString().slice(0, 10);
	const program = await loadActiveProgram(event.locals.supabase, user.id);
	const validPhaseIds = new Set((program?.workout?.phases ?? []).map((phase) => phase.id));

	const accepted: SyncItem[] = [];
	const results: SyncResult[] = [];
	for (const raw of rawItems) {
		const checked = validateSyncItem(raw, today);
		if (checked.ok) accepted.push(checked.value);
		else
			results.push({
				id: String((raw as { id?: unknown })?.id ?? ''),
				status: 'rejected',
				message: checked.message
			});
	}

	const saved = await saveSyncItems(
		event.locals.supabase,
		user.id,
		program?.id ?? null,
		validPhaseIds,
		accepted
	);
	return json(
		{ results: [...results, ...saved] },
		{ headers: { 'Cache-Control': 'private, no-store' } }
	);
};

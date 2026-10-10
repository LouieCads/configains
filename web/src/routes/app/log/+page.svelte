<script lang="ts">
	import { onMount } from 'svelte';
	import { progressMetrics } from '$lib/coaching/progress';
	import { enqueue, flush, type OutboxRecord, type OutboxStore } from '$lib/coaching/outbox';
	import { validateSyncItem, type EntryInput, type SyncItem } from '$lib/coaching/sync';
	import {
		cacheProgram,
		clearLocalData,
		fetchProgram,
		openOffline,
		outboxStore,
		readCachedProgram,
		sendBatch
	} from '$lib/client/offline';
	import { card, error, help, primary, secondary, subtle, success } from '$lib/features/cms/styles';

	type Exercise = { id: string; name: string; sets: number | null; reps: string | null };
	type Phase = { id: string; name: string; exercises: Exercise[] };
	type Program = {
		id: string;
		currentPhaseId: string | null;
		workout: { name: string; phases: Phase[] } | null;
	} | null;

	const localDay = () =>
		new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);

	let db: IDBDatabase | null = null;
	let store: OutboxStore | null = null;
	let program = $state<Program>(null);
	let cachedAt = $state<string | null>(null);
	let signedOut = $state(false);
	let records = $state<OutboxRecord[]>([]);
	let online = $state(true);
	let syncing = $state(false);
	let lastSynced = $state<string | null>(null);
	let message = $state<{ kind: 'error' | 'success'; text: string } | null>(null);

	let loggedOn = $state(localDay());
	let completed = $state(true);
	let duration = $state<number | null>(null);
	let notes = $state('');
	let phaseId = $state('');
	let rows = $state<EntryInput[]>([]);

	let metricKey = $state<(typeof progressMetrics)[number]['key']>(progressMetrics[0].key);
	let metricValue = $state<number | null>(null);
	let metricDate = $state(localDay());

	const phases = $derived(program?.workout?.phases ?? []);
	const pending = $derived(records.filter((record) => record.status === 'pending').length);
	const rejected = $derived(records.filter((record) => record.status === 'rejected'));

	function entriesForPhase(id: string): EntryInput[] {
		const phase = phases.find((option) => option.id === id);
		return (phase?.exercises ?? []).map((exercise) => ({
			exercise_id: exercise.id,
			name: exercise.name,
			sets: exercise.sets,
			reps: exercise.reps,
			load_kg: null,
			completed: true
		}));
	}

	async function refresh() {
		if (store) records = await store.list();
	}

	async function loadProgram() {
		if (navigator.onLine && db) {
			try {
				const live = await fetchProgram();
				if (live.signedOut) {
					signedOut = true;
					program = null;
					return;
				}
				signedOut = false;
				program = live.program as Program;
				cachedAt = null;
				await cacheProgram(db, live.program);
				phaseId = program?.currentPhaseId ?? phases[0]?.id ?? '';
				rows = entriesForPhase(phaseId);
				return;
			} catch {
				// Fall through to the cached copy.
			}
		}
		const cached = db ? await readCachedProgram(db) : null;
		if (cached) {
			program = cached.program as Program;
			cachedAt = cached.savedAt;
			phaseId = program?.currentPhaseId ?? phases[0]?.id ?? '';
			rows = entriesForPhase(phaseId);
		}
	}

	async function sync() {
		if (!store || syncing) return;
		syncing = true;
		try {
			const result = await flush(store, sendBatch);
			await refresh();
			if (result.offline && records.length > 0)
				message = {
					kind: 'error',
					text: 'Could not reach the server. Entries stay on this device and will retry.'
				};
			else if (result.synced > 0) {
				lastSynced = new Date().toLocaleTimeString('en-GB', { timeStyle: 'short' });
				message = {
					kind: 'success',
					text: `${result.synced} ${result.synced === 1 ? 'entry' : 'entries'} synced.`
				};
			}
		} finally {
			syncing = false;
		}
	}

	/** Validates and stores an entry locally. Returns false, with the reason shown, if it was not saved. */
	async function queue(item: SyncItem, saved: string): Promise<boolean> {
		if (!store) return false;
		const checked = validateSyncItem(item, localDay());
		if (!checked.ok) {
			message = { kind: 'error', text: checked.message };
			return false;
		}
		await enqueue(store, item, new Date().toISOString());
		await refresh();
		message = { kind: 'success', text: saved };
		void sync();
		return true;
	}

	async function saveWorkout(event: SubmitEvent) {
		event.preventDefault();
		const saved = await queue(
			{
				kind: 'workout',
				id: crypto.randomUUID(),
				logged_on: loggedOn,
				completed,
				duration_minutes: duration,
				notes: notes.trim() || null,
				phase_id: phaseId || null,
				entries: rows
			},
			'Workout saved on this device.'
		);
		if (saved) {
			notes = '';
			duration = null;
			rows = entriesForPhase(phaseId);
		}
	}

	async function saveMetric(event: SubmitEvent) {
		event.preventDefault();
		if (metricValue === null) {
			message = { kind: 'error', text: 'Enter a value.' };
			return;
		}
		const saved = await queue(
			{
				kind: 'metric',
				id: crypto.randomUUID(),
				metric: metricKey,
				value: metricValue,
				measured_on: metricDate
			},
			'Measurement saved on this device.'
		);
		if (saved) metricValue = null;
	}

	async function discard(id: string) {
		if (!store) return;
		await store.remove(id);
		await refresh();
	}

	async function signOut(event: SubmitEvent) {
		const form = event.currentTarget as HTMLFormElement;
		event.preventDefault();
		if (
			pending > 0 &&
			!confirm(
				`${pending} ${pending === 1 ? 'entry is' : 'entries are'} not synced yet. They will be removed from this device. Sign out anyway?`
			)
		)
			return;
		if (db) await clearLocalData(db);
		form.submit();
	}

	onMount(() => {
		online = navigator.onLine;
		const goOnline = () => {
			online = true;
			void loadProgram().then(sync);
		};
		const goOffline = () => (online = false);
		window.addEventListener('online', goOnline);
		window.addEventListener('offline', goOffline);

		(async () => {
			try {
				db = await openOffline();
				store = outboxStore(db);
				await refresh();
			} catch {
				message = {
					kind: 'error',
					text: 'This browser cannot store entries offline. Connect to save.'
				};
			}
			await loadProgram();
			await sync();
		})();

		return () => {
			window.removeEventListener('online', goOnline);
			window.removeEventListener('offline', goOffline);
		};
	});
</script>

<svelte:head
	><title>Log your training | Configains</title><meta
		name="robots"
		content="noindex, nofollow"
	/></svelte:head
>
<main class="mx-auto grid max-w-[640px] gap-6 p-6">
	<p><a href="/app">Back to your program</a> · <a href="/app/progress">Progress</a></p>
	<h1>Log your training</h1>

	<section class={card} aria-live="polite">
		<p>
			{online ? 'Online' : 'Offline'} · {pending} waiting to sync{lastSynced
				? ` · last synced ${lastSynced}`
				: ''}
		</p>
		{#if message}<p class={message.kind === 'error' ? error : success} role="status">
				{message.text}
			</p>{/if}
		{#if cachedAt}<p class={help}>
				Showing the plan saved on {new Date(cachedAt).toLocaleString('en-GB')}.
			</p>{/if}
		{#if syncing}<p class={help}>Syncing…</p>{/if}
		{#if rejected.length > 0}
			<h2>Needs attention</h2>
			<p class={help}>
				These entries were not accepted. Check them, then discard or log them again.
			</p>
			<ul class="grid gap-2">
				{#each rejected as record (record.item.id)}
					<li class="rounded-lg border border-line p-3">
						<p class={error}>{record.message}</p>
						<p class={help}>
							{record.item.kind === 'workout'
								? `Workout on ${record.item.logged_on}`
								: `Measurement on ${record.item.measured_on}`}
						</p>
						<button type="button" class={subtle} onclick={() => discard(record.item.id)}
							>Discard</button
						>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	{#if signedOut}
		<section class={card}>
			<p>Sign in to log training and see your program.</p>
			<a class={primary} href="/login?redirectTo=/app/log">Sign in</a>
		</section>
	{:else if !program}
		<section class={card}>
			<p>Your program will appear here once it is assigned and you have connected once.</p>
		</section>
	{:else if program.workout}
		<form class={card} onsubmit={saveWorkout}>
			<h2>{program.workout.name}</h2>
			<label class="my-2 grid gap-1"
				>Date
				<input type="date" bind:value={loggedOn} required />
			</label>
			<label class="my-2 grid gap-1"
				>Phase
				<select bind:value={phaseId} onchange={() => (rows = entriesForPhase(phaseId))}>
					{#each phases as phase (phase.id)}
						<option value={phase.id}>{phase.name}</option>
					{/each}
				</select>
			</label>
			{#each rows as row, index (index)}
				<fieldset class="my-3 rounded-lg border border-line p-3">
					<legend>{row.name}</legend>
					<div class="flex flex-wrap gap-2">
						<label class="grid gap-1"
							>Sets<input type="number" min="0" max="50" bind:value={row.sets} /></label
						>
						<label class="grid gap-1">Reps<input bind:value={row.reps} maxlength="40" /></label>
						<label class="grid gap-1"
							>Load (kg)<input
								type="number"
								min="0"
								max="1000"
								step="0.5"
								bind:value={row.load_kg}
							/></label
						>
					</div>
					<label class="my-2 flex items-center gap-2"
						><input type="checkbox" bind:checked={row.completed} /> Done</label
					>
				</fieldset>
			{/each}
			<label class="my-2 grid gap-1"
				>Session length (minutes)
				<input type="number" min="0" max="600" bind:value={duration} />
			</label>
			<label class="my-2 flex items-center gap-2"
				><input type="checkbox" bind:checked={completed} /> Session completed</label
			>
			<label class="my-2 grid gap-1"
				>Notes
				<textarea bind:value={notes} rows="2" maxlength="1000"></textarea>
			</label>
			<button class={primary}>Save workout</button>
		</form>
	{/if}

	{#if program}
		<form class={card} onsubmit={saveMetric}>
			<h2>Measurement</h2>
			<label class="my-2 grid gap-1"
				>What
				<select bind:value={metricKey}>
					{#each progressMetrics as metric (metric.key)}
						<option value={metric.key}>{metric.label} ({metric.unit})</option>
					{/each}
				</select>
			</label>
			<label class="my-2 grid gap-1"
				>Value
				<input type="number" step="0.1" bind:value={metricValue} required />
			</label>
			<label class="my-2 grid gap-1"
				>Date
				<input type="date" bind:value={metricDate} required />
			</label>
			<button class={secondary}>Save measurement</button>
		</form>
	{/if}

	<form method="POST" action="/logout" onsubmit={signOut}>
		<button class={subtle}>Sign out and clear this device</button>
	</form>
</main>

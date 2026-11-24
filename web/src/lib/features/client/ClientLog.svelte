<script lang="ts">
	import TrendingUp from '@lucide/svelte/icons/trending-up';
	import Trash2 from '@lucide/svelte/icons/trash';
	import LogIn from '@lucide/svelte/icons/log-in';
	import Save from '@lucide/svelte/icons/save';
	import Ruler from '@lucide/svelte/icons/ruler';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Footprints from '@lucide/svelte/icons/footprints';
	import HeartPulse from '@lucide/svelte/icons/heart-pulse';
	import { onMount } from 'svelte';
	import type { loadClientLog } from '$lib/server/coaching/client-view';
	import { progressMetrics } from '$lib/coaching/progress';
	import { cardioRequirement, targetsFromRow, type ClientTargets } from '$lib/coaching/targets';
	import { formatNumber } from '$lib/features/progress/chart';
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
	import {
		card,
		error,
		help,
		primary,
		secondary,
		subtle,
		success,
		requiredMark
	} from '$lib/features/cms/styles';

	type Exercise = { id: string; name: string; sets: number | null; reps: string | null };
	type Phase = { id: string; name: string; exercises: Exercise[] };
	// In preview the coach sees the client's plan and targets from the server. Nothing is stored on this
	// device, synced or saved, so the page is the client's logging screen with the saving turned off.
	let {
		data,
		base = '/app',
		preview = false
	}: {
		data?: Awaited<ReturnType<typeof loadClientLog>>;
		base?: string;
		preview?: boolean;
	} = $props();

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

	let targets = $state<ClientTargets | null>(null);
	let stepsDate = $state(localDay());
	let stepsCount = $state<number | null>(null);
	let cardioDate = $state(localDay());
	let cardioMinutes = $state<number | null>(null);
	let cardioHeartRate = $state<number | null>(null);
	let cardioActivity = $state('');

	const requirement = $derived(cardioRequirement(targets));

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
				targets = live.targets ? targetsFromRow(live.targets as Partial<ClientTargets>) : null;
				cachedAt = null;
				await cacheProgram(db, live.program, live.targets);
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
			targets = cached.targets ? targetsFromRow(cached.targets as Partial<ClientTargets>) : null;
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
		if (preview) {
			message = { kind: 'error', text: 'Preview only. Nothing is saved from here.' };
			return false;
		}
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
				// IndexedDB cannot clone a $state proxy.
				entries: $state.snapshot(rows)
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

	async function saveSteps(event: SubmitEvent) {
		event.preventDefault();
		if (stepsCount === null) {
			message = { kind: 'error', text: 'Enter your step count.' };
			return;
		}
		const saved = await queue(
			{ kind: 'steps', id: crypto.randomUUID(), logged_on: stepsDate, steps: stepsCount },
			'Steps saved on this device.'
		);
		if (saved) stepsCount = null;
	}

	async function saveCardio(event: SubmitEvent) {
		event.preventDefault();
		if (cardioMinutes === null) {
			message = { kind: 'error', text: 'Enter how many minutes you did.' };
			return;
		}
		const saved = await queue(
			{
				kind: 'cardio',
				id: crypto.randomUUID(),
				logged_on: cardioDate,
				duration_minutes: cardioMinutes,
				avg_heart_rate: cardioHeartRate,
				activity: cardioActivity.trim() || null
			},
			'Cardio saved on this device.'
		);
		if (saved) {
			cardioMinutes = null;
			cardioHeartRate = null;
			cardioActivity = '';
		}
	}

	/** What a waiting entry is, for the "needs attention" list. */
	function describe(item: SyncItem) {
		if (item.kind === 'workout') return `Workout on ${item.logged_on}`;
		if (item.kind === 'metric') return `Measurement on ${item.measured_on}`;
		if (item.kind === 'steps') return `Steps on ${item.logged_on}`;
		return `Cardio on ${item.logged_on}`;
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
		if (preview) {
			program = (data?.program ?? null) as Program;
			targets = data?.targets ? targetsFromRow(data.targets) : null;
			phaseId = program?.currentPhaseId ?? phases[0]?.id ?? '';
			rows = entriesForPhase(phaseId);
			return;
		}
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
	><title>Log your progress | Configains</title><meta
		name="robots"
		content="noindex, nofollow"
	/></svelte:head
>
<main class="mx-auto grid max-w-[640px] gap-6 p-6">
	<p class="flex flex-wrap gap-4">
		<a href={base}>Back to your plan</a><a href="{base}/progress">Progress</a>
	</p>
	<h1>Log your progress</h1>

	<section class={card} aria-live="polite">
		<p>
			{online ? 'Online' : 'Offline'}. {pending} waiting to sync.{lastSynced
				? ` Last synced ${lastSynced}.`
				: ''}
		</p>
		{#if message}<p class={message.kind === 'error' ? error : success} role="status">
				{message.text}
			</p>
			<!-- Logging is done once an entry is saved, so offer where to go next instead of leaving them here. -->
			{#if message.kind === 'success'}<p class="flex flex-wrap gap-3">
					<a class={secondary} href="{base}/progress"
						><TrendingUp size={18} aria-hidden="true" />See your progress</a
					>
					<a class={secondary} href={base}>Back to your plan</a>
				</p>{/if}{/if}
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
						<p class={help}>{describe(record.item)}</p>
						<button type="button" class={subtle} onclick={() => discard(record.item.id)}
							><Trash2 size={16} aria-hidden="true" />Discard</button
						>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	{#if signedOut}
		<section class={card}>
			<p>Sign in to log training and see your program.</p>
			<a class={primary} href="/login?redirectTo=/app/log"
				><LogIn size={18} aria-hidden="true" />Sign in</a
			>
		</section>
	{:else}
		{#if program?.workout}
			<form class={card} onsubmit={saveWorkout}>
				<h2>{program.workout.name}</h2>
				<label class="my-2 grid gap-1"
					><span>Date<span class={requiredMark} aria-hidden="true">*</span></span>
					<input type="date" bind:value={loggedOn} required />
				</label>
				<label class="my-2 grid gap-1"
					><span>Phase<span class={requiredMark} aria-hidden="true">*</span></span>
					<select required bind:value={phaseId} onchange={() => (rows = entriesForPhase(phaseId))}>
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
				<button class={primary}><Save size={18} aria-hidden="true" />Save workout</button>
			</form>
		{:else if !program}
			<section class={card}>
				<p>
					Workout logging appears here once your program is assigned and you have connected once.
					You can log steps, cardio and measurements now.
				</p>
			</section>
		{/if}

		<form class={card} onsubmit={saveSteps}>
			<h2 class="flex items-center gap-2"><Footprints size={22} aria-hidden="true" />Steps</h2>
			{#if targets?.daily_steps_target}
				<p class={help}>
					Your target: {formatNumber(targets.daily_steps_target)} steps a day. Logging a day again replaces
					the earlier count.
				</p>
			{:else}
				<p class={help}>Logging a day again replaces the earlier count.</p>
			{/if}
			<label class="my-2 grid gap-1"
				><span>Date<span class={requiredMark} aria-hidden="true">*</span></span>
				<input type="date" bind:value={stepsDate} required />
			</label>
			<label class="my-2 grid gap-1"
				><span>Steps<span class={requiredMark} aria-hidden="true">*</span></span>
				<input
					type="number"
					inputmode="numeric"
					min="0"
					max="200000"
					step="1"
					bind:value={stepsCount}
					required
				/>
			</label>
			<button class={secondary}><Save size={18} aria-hidden="true" />Save steps</button>
		</form>

		<form class={card} onsubmit={saveCardio}>
			<h2 class="flex items-center gap-2"><HeartPulse size={22} aria-hidden="true" />Cardio</h2>
			{#if requirement}<p class={help}>Your plan: {requirement}.</p>{/if}
			{#if targets?.cardio_notes}
				<p class="my-3 rounded-lg border border-line p-3 text-[0.95rem]">
					<span class="font-semibold">From your coach:</span>
					{targets.cardio_notes}
				</p>
			{/if}
			<label class="my-2 grid gap-1"
				><span>Date<span class={requiredMark} aria-hidden="true">*</span></span>
				<input type="date" bind:value={cardioDate} required />
			</label>
			<label class="my-2 grid gap-1"
				><span>Minutes<span class={requiredMark} aria-hidden="true">*</span></span>
				<input
					type="number"
					inputmode="numeric"
					min="1"
					max="600"
					step="1"
					bind:value={cardioMinutes}
					required
				/>
			</label>
			<label class="my-2 grid gap-1"
				>Average heart rate (BPM, optional)
				<input
					type="number"
					inputmode="numeric"
					min="30"
					max="250"
					step="1"
					bind:value={cardioHeartRate}
				/>
			</label>
			<label class="my-2 grid gap-1"
				>What did you do? (optional)
				<input bind:value={cardioActivity} maxlength="60" list="cardio-types" />
				<datalist id="cardio-types">
					<option value="Walking"></option>
					<option value="Cycling"></option>
					<option value="Rowing"></option>
					<option value="Swimming"></option>
					<option value="Elliptical"></option>
					<option value="Jogging"></option>
				</datalist>
			</label>
			<button class={secondary}><Save size={18} aria-hidden="true" />Save cardio</button>
		</form>

		<form class={card} onsubmit={saveMetric}>
			<h2>Measurement</h2>
			<label class="my-2 grid gap-1"
				><span>What<span class={requiredMark} aria-hidden="true">*</span></span>
				<select required bind:value={metricKey}>
					{#each progressMetrics as metric (metric.key)}
						<option value={metric.key}>{metric.label} ({metric.unit})</option>
					{/each}
				</select>
			</label>
			<label class="my-2 grid gap-1"
				><span>Value<span class={requiredMark} aria-hidden="true">*</span></span>
				<input type="number" step="0.1" bind:value={metricValue} required />
			</label>
			<label class="my-2 grid gap-1"
				><span>Date<span class={requiredMark} aria-hidden="true">*</span></span>
				<input type="date" bind:value={metricDate} required />
			</label>
			<button class={secondary}><Ruler size={18} aria-hidden="true" />Save measurement</button>
		</form>
	{/if}

	{#if !preview}
		<form method="POST" action="/logout" onsubmit={signOut}>
			<button class={subtle}
				><LogOut size={16} aria-hidden="true" />Sign out and clear this device</button
			>
		</form>
	{/if}
</main>

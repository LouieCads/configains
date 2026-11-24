<script lang="ts">
	// One conversation with the coach, laid out like the messaging apps clients already use: their own
	// messages on the right, Cash's on the left, a day label between days, and a composer fixed at the
	// bottom. Messages, check-ins and Cash's feedback all sit in the same timeline, in time order.
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Check from '@lucide/svelte/icons/check';
	import CheckCheck from '@lucide/svelte/icons/check-check';
	import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
	import Send from '@lucide/svelte/icons/send';
	import { onMount } from 'svelte';
	import type { loadClientCoach } from '$lib/server/coaching/client-view';

	type Data = Awaited<ReturnType<typeof loadClientCoach>>;
	type Form = { message?: string; draft?: string; updated?: string } | null | undefined;
	// `preview` is the coach looking at the conversation as the client sees it: nothing is sent.
	let {
		data,
		form,
		base = '/app',
		preview = false
	}: { data: Data; form?: Form; base?: string; preview?: boolean } = $props();
	let previewNote = $state('');

	const messageLimit = 2000;

	type Entry = {
		key: string;
		at: string;
		mine: boolean;
		body: string;
		kind: 'message' | 'checkin' | 'feedback';
		/** For the client's own messages: has Cash opened it. Null when it does not apply. */
		seen: boolean | null;
		waiting: boolean;
	};

	const entries = $derived<Entry[]>(
		[
			...data.messages.map((message): Entry => ({
				key: `m-${message.id}`,
				at: message.created_at,
				mine: message.sender_role === 'client',
				body: message.body,
				kind: 'message',
				seen: message.sender_role === 'client' ? message.read_at !== null : null,
				waiting: false
			})),
			...data.checkIns.flatMap((checkIn): Entry[] => [
				{
					key: `c-${checkIn.id}`,
					at: checkIn.created_at,
					mine: true,
					body: checkIn.body,
					kind: 'checkin',
					seen: null,
					waiting: !checkIn.coach_feedback
				},
				...(checkIn.coach_feedback
					? [
							{
								key: `f-${checkIn.id}`,
								at: checkIn.feedback_at ?? checkIn.created_at,
								mine: false,
								body: checkIn.coach_feedback,
								kind: 'feedback' as const,
								seen: null,
								waiting: false
							}
						]
					: [])
			])
		].sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
	);

	// The server formats in UTC. Once the page is in the browser, times follow the viewer's own clock.
	let zone = $state<string | undefined>('UTC');
	let now = $state(Date.now());
	const dayKey = (at: number | string) =>
		new Date(at).toLocaleDateString('en-CA', { timeZone: zone });
	const time = (at: string) =>
		new Date(at).toLocaleTimeString('en-GB', {
			hour: '2-digit',
			minute: '2-digit',
			timeZone: zone
		});
	function dayLabel(at: string) {
		const key = dayKey(at);
		if (key === dayKey(now)) return 'Today';
		if (key === dayKey(now - 86_400_000)) return 'Yesterday';
		return new Date(at).toLocaleDateString('en-GB', {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			year: key.slice(0, 4) === dayKey(now).slice(0, 4) ? undefined : 'numeric',
			timeZone: zone
		});
	}

	// Each entry knows whether it opens a new day and whether it starts a run from one sender, so the
	// day label, the spacing and the bubble corner are decided in one place.
	const timeline = $derived(
		entries.map((entry, index) => {
			const before = entries[index - 1];
			const newDay = !before || dayKey(before.at) !== dayKey(entry.at);
			return { entry, newDay, firstInRun: newDay || before.mine !== entry.mine };
		})
	);

	// svelte-ignore state_referenced_locally
	let draft = $state<string>(form && 'draft' in form ? String(form.draft) : '');
	let ready = $state(false);
	let log: HTMLElement | undefined = $state();
	let field: HTMLTextAreaElement | undefined = $state();

	const empty = $derived(draft.trim() === '');
	const tooLongForMessage = $derived(draft.length > messageLimit);
	// Without JavaScript the buttons stay enabled and the server checks the text.
	const canMessage = $derived(!ready || (!empty && !tooLongForMessage));
	const canCheckIn = $derived(!ready || !empty);

	function grow() {
		if (!field) return;
		field.style.height = 'auto';
		field.style.height = `${Math.min(field.scrollHeight, 160)}px`;
	}
	function enterToSend(event: KeyboardEvent & { currentTarget: HTMLTextAreaElement }) {
		// Enter sends and Shift+Enter adds a line, but only with a keyboard: on a phone Enter adds a line.
		if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
		if (!matchMedia('(pointer: fine)').matches) return;
		event.preventDefault();
		if (canMessage && !empty) event.currentTarget.form?.requestSubmit();
	}
	function toLatest() {
		if (log) log.scrollTop = log.scrollHeight;
	}

	onMount(() => {
		zone = undefined;
		now = Date.now();
		ready = true;
		grow();
		toLatest();
	});
</script>

<svelte:head
	><title>Your coach | Configains</title><meta
		name="robots"
		content="noindex, nofollow"
	/></svelte:head
>

<div
	class="mx-auto flex {preview
		? 'h-[calc(100dvh-2.75rem)]'
		: 'h-dvh'} max-w-[640px] flex-col border-line bg-floor font-arial text-base/[1.5] text-ink min-[640px]:border-x"
>
	<header class="flex items-center gap-3 bg-night px-3 py-2.5 text-white">
		<a
			class="grid size-10 shrink-0 place-items-center rounded-full text-white hover:bg-white/10"
			href={base}
			aria-label="Back to your program"><ArrowLeft size={22} aria-hidden="true" /></a
		>
		<span
			class="grid size-10 shrink-0 place-items-center rounded-full bg-cyan font-bold text-night"
			aria-hidden="true">C</span
		>
		<div class="min-w-0">
			<h1 class="m-0 text-[1.05rem] leading-tight font-bold">Cash</h1>
			<p class="m-0 text-[0.8rem] text-white/75">Your coach</p>
		</div>
	</header>

	<!-- A scrolling region has to be reachable by keyboard, or its history cannot be read without a mouse. -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		bind:this={log}
		class="flex-1 overflow-y-auto px-3 py-4"
		role="log"
		aria-label="Conversation with Cash"
		tabindex="0"
	>
		{#if timeline.length === 0}
			<p
				class="mx-auto mt-6 max-w-xs rounded-xl bg-paper p-4 text-center text-[0.95rem] text-muted"
			>
				<strong class="text-ink">No messages yet.</strong> Ask Cash a question, or share how training
				is going.
			</p>
		{/if}

		{#each timeline as { entry, newDay, firstInRun } (entry.key)}
			{#if newDay}
				<p
					class="mx-auto mt-4 mb-3 w-fit rounded-full bg-paper px-3 py-1 text-[0.75rem] font-semibold text-muted first:mt-0"
				>
					{dayLabel(entry.at)}
				</p>
			{/if}
			<div
				class={[
					'flex',
					entry.mine ? 'justify-end' : 'justify-start',
					firstInRun && !newDay ? 'mt-3' : 'mt-0.5'
				]}
			>
				<div
					class={[
						'max-w-[85%] min-w-0 rounded-2xl px-3 py-2 shadow-sm',
						entry.mine ? 'bg-mist' : 'border border-line bg-paper',
						firstInRun && (entry.mine ? 'rounded-tr-sm' : 'rounded-tl-sm')
					]}
				>
					{#if entry.kind !== 'message'}
						<p
							class="m-0 mb-1 flex items-center gap-1 text-[0.7rem] font-bold tracking-[1px] text-cyan-deep uppercase"
						>
							<ClipboardCheck size={13} aria-hidden="true" />{entry.kind === 'checkin'
								? 'Check-in'
								: 'Feedback on your check-in'}
						</p>
					{/if}
					<p class="m-0 break-words whitespace-pre-wrap">{entry.body}</p>
					<p class="m-0 mt-1 flex items-center justify-end gap-1 text-[0.7rem] text-muted">
						{#if entry.waiting}<span class="mr-auto italic">Waiting for feedback</span>{/if}
						<time datetime={entry.at}>{time(entry.at)}</time>
						{#if entry.seen === true}
							<CheckCheck size={14} class="text-cyan-ink" aria-hidden="true" /><span class="sr-only"
								>Seen</span
							>
						{:else if entry.seen === false}
							<Check size={14} aria-hidden="true" /><span class="sr-only">Sent</span>
						{/if}
					</p>
				</div>
			</div>
		{/each}
	</div>

	<form
		method="POST"
		action="?/message"
		class="border-t border-line bg-paper px-3 py-2.5"
		onsubmit={(event) => {
			if (!preview) return;
			event.preventDefault();
			previewNote = 'Preview only. Nothing is sent from here.';
		}}
	>
		{#if previewNote || form?.message}
			<p class="m-0 mb-2 text-[0.85rem] font-semibold text-[#962f24]" role="alert">
				{previewNote || form?.message}
			</p>
		{/if}
		<div class="flex items-end gap-2">
			<textarea
				bind:this={field}
				bind:value={draft}
				oninput={grow}
				onkeydown={enterToSend}
				name="body"
				rows="1"
				maxlength="4000"
				required
				placeholder="Message Cash"
				aria-label="Message to Cash"
				class="max-h-40 min-h-11 flex-1 resize-none rounded-3xl border-line bg-floor px-4 py-2.5 leading-normal focus:border-cyan-ink focus:ring-2 focus:ring-cyan-ink"
			></textarea>
			<button
				type="submit"
				class="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full bg-cyan-ink text-white disabled:cursor-not-allowed disabled:opacity-50"
				aria-label="Send message"
				disabled={!canMessage}><Send size={20} aria-hidden="true" /></button
			>
		</div>
		<div class="mt-1.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[0.8rem]">
			<button
				type="submit"
				formaction="?/checkin"
				class="inline-flex min-h-9 cursor-pointer items-center gap-1.5 font-semibold text-cyan-ink underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
				disabled={!canCheckIn}
				><ClipboardCheck size={16} aria-hidden="true" />Send as check-in for feedback</button
			>
			{#if tooLongForMessage}
				<span class="text-[#962f24]" role="status"
					><strong>{draft.length.toLocaleString('en-GB')}</strong> of {messageLimit.toLocaleString(
						'en-GB'
					)}: too long for a message. Send it as a check-in instead.</span
				>
			{/if}
		</div>
	</form>
</div>

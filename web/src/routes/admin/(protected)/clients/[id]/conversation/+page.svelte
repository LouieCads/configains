<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Send from '@lucide/svelte/icons/send';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import {
		badgeWarn,
		card,
		error,
		help,
		primary,
		requiredMark,
		subtle,
		success
	} from '$lib/features/cms/styles';
	let { data, form } = $props();

	const when = (value: string) =>
		new Date(value).toLocaleDateString('en-GB', { dateStyle: 'medium' });
	const name = $derived(data.client.display_name ?? 'Unnamed client');
	const isHuman = $derived(data.client.coaching_mode === 'human');
	const pending = $derived(data.checkIns.filter((checkIn) => !checkIn.coach_feedback));
	const answered = $derived(data.checkIns.filter((checkIn) => checkIn.coach_feedback));
	const unread = $derived(
		data.messages.filter((message) => message.sender_role === 'client' && !message.read_at).length
	);
	const savedLabel: Record<string, string> = {
		feedback: 'Feedback sent.',
		reply: 'Message sent.'
	};

	let busy = $state<string | null>(null);
	/** Keeps the page where it is after a save and shows which form is working. */
	const keepPlace =
		(key: string, reset = true): SubmitFunction =>
		() => {
			busy = key;
			return async ({ update }) => {
				await update({ reset });
				busy = null;
			};
		};

	let messageList = $state<HTMLUListElement>();
	$effect(() => {
		void data.messages.length;
		messageList?.scrollTo({ top: messageList.scrollHeight });
	});
	/** Ctrl or Cmd + Enter sends a message or feedback. */
	function sendOnShortcut(event: KeyboardEvent) {
		if (event.key === 'Enter' && (event.ctrlKey || event.metaKey))
			(event.currentTarget as HTMLTextAreaElement).form?.requestSubmit();
	}

	const cardHead = 'mb-4 flex min-h-9 flex-wrap items-center justify-between gap-3';
	const title = 'mb-0! text-[1.5rem]!';
</script>

<svelte:head><title>Check-ins and messages: {name} | Configains CMS</title></svelte:head>

<p class="mb-0">
	<a class="inline-flex items-center gap-1 text-cyan-ink" href="/admin/clients/{data.client.id}"
		><ArrowLeft size={16} aria-hidden="true" />{name}</a
	>
</p>
<h1 class="my-3!">Check-ins and messages</h1>

{#if form?.message}<p class={error} role="alert">{form.message}</p>{/if}
{#if form?.updated}<p class={success} role="status">
		{savedLabel[form.updated] ?? 'Saved.'}
	</p>{/if}

<div class="grid items-start gap-6 min-[1100px]:grid-cols-2">
	<section id="check-ins" class={card} aria-labelledby="check-ins-title">
		<div class={cardHead}>
			<h2 id="check-ins-title" class={title}>Check-ins</h2>
			{#if pending.length > 0}<span class={badgeWarn}>{pending.length} to answer</span>{/if}
		</div>
		{#if data.checkIns.length === 0}
			<p class="m-0 text-muted">None yet.</p>
		{:else if pending.length === 0}
			<p class="m-0 text-muted">All answered.</p>
		{/if}
		{#each pending as checkIn (checkIn.id)}
			<article class="mb-4 grid gap-2 rounded-lg border border-[#efb8ac] p-4 last:mb-0">
				<p class="m-0 text-[0.85rem] text-muted">{when(checkIn.submitted_on)}</p>
				<p class="m-0 whitespace-pre-line">{checkIn.body}</p>
				<form
					method="POST"
					action="?/feedback"
					class="m-0 grid gap-2"
					use:enhance={keepPlace(`feedback-${checkIn.id}`)}
				>
					<input type="hidden" name="check_in_id" value={checkIn.id} />
					<label class="sr-only" for="feedback-{checkIn.id}">Your feedback</label>
					<textarea
						id="feedback-{checkIn.id}"
						name="feedback"
						rows="3"
						maxlength="4000"
						required
						placeholder="Your feedback"
						onkeydown={sendOnShortcut}></textarea>
					<button class={primary} disabled={busy === `feedback-${checkIn.id}`} title="Ctrl + Enter"
						><Send size={18} aria-hidden="true" />Send feedback</button
					>
				</form>
			</article>
		{/each}
		{#if answered.length > 0}
			<details class="mt-4">
				<summary class="cursor-pointer font-semibold text-cyan-ink"
					>Answered ({answered.length})</summary
				>
				{#each answered as checkIn (checkIn.id)}
					<article class="mt-4 grid gap-2 border-b border-line pb-4 last:border-b-0">
						<p class="m-0 text-[0.85rem] text-muted">{when(checkIn.submitted_on)}</p>
						<p class="m-0 whitespace-pre-line">{checkIn.body}</p>
						<form
							method="POST"
							action="?/feedback"
							class="m-0 grid gap-2"
							use:enhance={keepPlace(`feedback-${checkIn.id}`, false)}
						>
							<input type="hidden" name="check_in_id" value={checkIn.id} />
							<label class="grid gap-1 text-[0.85rem] font-semibold"
								><span>Your feedback<span class={requiredMark} aria-hidden="true">*</span></span>
								<textarea name="feedback" rows="2" maxlength="4000" required
									>{checkIn.coach_feedback ?? ''}</textarea
								>
							</label>
							<button class={subtle} disabled={busy === `feedback-${checkIn.id}`}
								><Pencil size={16} aria-hidden="true" />Update</button
							>
						</form>
					</article>
				{/each}
			</details>
		{/if}
	</section>

	<section id="messages" class={card} aria-labelledby="messages-title">
		<div class={cardHead}>
			<h2 id="messages-title" class={title}>Messages</h2>
			{#if unread > 0}<span class={badgeWarn}>{unread} new</span>{/if}
		</div>
		{#if data.messages.length === 0}
			<p class="m-0 text-muted">None yet.</p>
		{:else}
			<ul bind:this={messageList} class="m-0 grid max-h-[60vh] list-none gap-2 overflow-y-auto p-0">
				{#each data.messages as message (message.id)}
					{@const mine = message.sender_role === 'coach'}
					<li
						class={[
							'max-w-[85%] rounded-xl px-4 py-2',
							mine
								? 'justify-self-end border border-cyan-ink'
								: 'justify-self-start border border-[#b7c6c7]'
						]}
					>
						<p class="m-0 text-[0.75rem] text-muted">
							<span class="font-semibold">{mine ? 'You' : name}</span>
							<span class="ml-2">{when(message.created_at)}</span>
							{#if !mine && !message.read_at}<span class="{badgeWarn} ml-2">New</span>{/if}
						</p>
						<p class="m-0 whitespace-pre-line">{message.body}</p>
					</li>
				{/each}
			</ul>
		{/if}
		{#if isHuman}
			<form method="POST" action="?/reply" class="mt-4 grid gap-2" use:enhance={keepPlace('reply')}>
				<label class="sr-only" for="reply-body">Message</label>
				<textarea
					id="reply-body"
					name="body"
					rows="2"
					maxlength="2000"
					required
					placeholder="Write a message"
					onkeydown={sendOnShortcut}></textarea>
				<button class={primary} disabled={busy === 'reply'} title="Ctrl + Enter"
					><Send size={18} aria-hidden="true" />Send</button
				>
			</form>
		{:else}
			<p class="{help} mb-0!">Switch the client to Human coaching to reply.</p>
		{/if}
	</section>
</div>

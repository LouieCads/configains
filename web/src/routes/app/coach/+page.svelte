<script lang="ts">
	import { card, error, help, primary, success } from '$lib/features/cms/styles';
	let { data, form } = $props();

	const when = (value: string) =>
		new Date(value).toLocaleDateString('en-GB', { dateStyle: 'medium' });
</script>

<svelte:head
	><title>Your coach | Configains</title><meta
		name="robots"
		content="noindex, nofollow"
	/></svelte:head
>
<main class="mx-auto grid max-w-[640px] gap-6 p-6">
	<p><a href="/app">Back to your program</a></p>
	<h1>Your coach</h1>

	{#if form?.message}<p class={error} role="alert">{form.message}</p>{/if}
	{#if form?.updated === 'checkin'}<p class={success} role="status">Check-in sent to Cash.</p>{/if}
	{#if form?.updated === 'message'}<p class={success} role="status">Message sent.</p>{/if}

	<section class={card}>
		<h2>Check-ins</h2>
		<p class={help}>Share how training and nutrition are going. Cash replies here.</p>
		<form method="POST" action="?/checkin" class="grid gap-2">
			<label class="grid gap-1"
				>Check-in
				<textarea name="body" rows="4" maxlength="4000" required></textarea>
			</label>
			<button class={primary}>Send check-in</button>
		</form>

		{#each data.checkIns as checkIn (checkIn.id)}
			<article class="my-4 grid gap-2 border-b border-line pb-4">
				<p class={help}>{when(checkIn.submitted_on)}</p>
				<p>{checkIn.body}</p>
				{#if checkIn.coach_feedback}
					<div class="rounded-lg bg-floor p-3">
						<strong>Feedback from Cash</strong>
						{#if checkIn.feedback_at}<span class={help}> · {when(checkIn.feedback_at)}</span>{/if}
						<p>{checkIn.coach_feedback}</p>
					</div>
				{:else}
					<p class={help}>Waiting for feedback.</p>
				{/if}
			</article>
		{/each}
	</section>

	<section class={card}>
		<h2>Messages</h2>
		{#if data.messages.length === 0}
			<p>No messages yet. Send Cash a question below.</p>
		{/if}
		<ul class="grid gap-3">
			{#each data.messages as message (message.id)}
				<li class="rounded-lg border border-line p-3">
					<strong>{message.sender_role === 'coach' ? 'Cash' : 'You'}</strong>
					<span class={help}>{when(message.created_at)}</span>
					<p>{message.body}</p>
				</li>
			{/each}
		</ul>
		<form method="POST" action="?/message" class="mt-4 grid gap-2">
			<label class="grid gap-1"
				>Message
				<textarea name="body" rows="3" maxlength="2000" required></textarea>
			</label>
			<button class={primary}>Send message</button>
		</form>
	</section>
</main>

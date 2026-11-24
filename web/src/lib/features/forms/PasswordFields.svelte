<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import Circle from '@lucide/svelte/icons/circle';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import X from '@lucide/svelte/icons/x';
	import {
		maxPasswordLength,
		minPasswordLength,
		passwordChecks,
		passwordExample
	} from '$lib/auth/password';
	import type { PasswordCheck } from '$lib/auth/password';
	import PasswordInput from './PasswordInput.svelte';

	let password = $state('');
	let confirmation = $state('');
	const checks = $derived(passwordChecks(password, confirmation));
	const passwordHints = $derived(checks.filter((check) => check.id !== 'match'));
	const matchHint = $derived(checks.filter((check) => check.id === 'match'));
	const common = $derived(checks.find((check) => check.id === 'common')?.state === 'warn');
	const tone = {
		idle: 'text-muted',
		ok: 'text-[#175e4d]',
		bad: 'text-[#962f24]',
		warn: 'text-[#8a5a00]'
	} as const;
	const stateText = { idle: '', ok: 'Done. ', bad: 'Not yet. ', warn: 'Warning. ' } as const;
</script>

{#snippet hints(id: string, items: PasswordCheck[])}
	<ul {id} class="-mt-2 mb-3 grid list-none gap-1.5 p-0 text-[0.85rem]">
		{#each items as check (check.id)}
			<li class="flex items-center gap-2 {tone[check.state]}">
				{#if check.state === 'ok'}<Check size={16} aria-hidden="true" />
				{:else if check.state === 'bad'}<X size={16} aria-hidden="true" />
				{:else if check.state === 'warn'}<TriangleAlert size={16} aria-hidden="true" />
				{:else}<Circle size={16} aria-hidden="true" />{/if}
				<span><span class="sr-only">{stateText[check.state]}</span>{check.label}</span>
			</li>
		{/each}
	</ul>
{/snippet}

<PasswordInput
	id="new-password"
	name="password"
	label="New password"
	autocomplete="new-password"
	placeholder={passwordExample}
	minlength={minPasswordLength}
	maxlength={maxPasswordLength}
	describedby="password-checks"
	bind:value={password}
/>
{@render hints('password-checks', passwordHints)}
<!-- A hint, not a block: the password is still accepted, so the notice never stops someone mid-flow. -->
<p class="{common ? 'my-3' : 'm-0'} text-[0.85rem] text-[#8a5a00]" role="status">
	{#if common}Heads up: this is a common password that is easy to guess. Choose something harder to
		guess, like a few unrelated words or a longer phrase.{/if}
</p>
<PasswordInput
	id="confirm-password"
	name="confirmation"
	label="Confirm password"
	autocomplete="new-password"
	placeholder={passwordExample}
	minlength={minPasswordLength}
	maxlength={maxPasswordLength}
	describedby="confirmation-check"
	bind:value={confirmation}
/>
{@render hints('confirmation-check', matchHint)}

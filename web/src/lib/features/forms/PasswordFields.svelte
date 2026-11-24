<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import Circle from '@lucide/svelte/icons/circle';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import X from '@lucide/svelte/icons/x';
	import { maxPasswordLength, passwordChecks, passwordExample } from '$lib/auth/password';
	import { authLabel, requiredMark } from '$lib/features/cms/styles';

	let password = $state('');
	let confirmation = $state('');
	const checks = $derived(passwordChecks(password, confirmation));
	const common = $derived(checks.find((check) => check.id === 'common')?.state === 'warn');
	const tone = {
		idle: 'text-muted',
		ok: 'text-[#175e4d]',
		bad: 'text-[#962f24]',
		warn: 'text-[#8a5a00]'
	} as const;
	const stateText = { idle: '', ok: 'Done. ', bad: 'Not yet. ', warn: 'Warning. ' } as const;
</script>

<label class={authLabel}
	><span>New password<span class={requiredMark} aria-hidden="true">*</span></span><input
		name="password"
		type="password"
		autocomplete="new-password"
		placeholder={passwordExample}
		minlength="12"
		maxlength={maxPasswordLength}
		required
		bind:value={password}
		aria-describedby="password-checks"
	/></label
>
<label class={authLabel}
	><span>Confirm password<span class={requiredMark} aria-hidden="true">*</span></span><input
		name="confirmation"
		type="password"
		autocomplete="new-password"
		placeholder={passwordExample}
		minlength="12"
		maxlength={maxPasswordLength}
		required
		bind:value={confirmation}
		aria-describedby="password-checks"
	/></label
>
<ul id="password-checks" class="my-3 grid list-none gap-1.5 p-0 text-[0.85rem]">
	{#each checks as check (check.id)}
		<li class="flex items-center gap-2 {tone[check.state]}">
			{#if check.state === 'ok'}<Check size={16} aria-hidden="true" />
			{:else if check.state === 'bad'}<X size={16} aria-hidden="true" />
			{:else if check.state === 'warn'}<TriangleAlert size={16} aria-hidden="true" />
			{:else}<Circle size={16} aria-hidden="true" />{/if}
			<span><span class="sr-only">{stateText[check.state]}</span>{check.label}</span>
		</li>
	{/each}
</ul>
<!-- A hint, not a block: the password is still accepted, so the notice never stops someone mid-flow. -->
<p class="my-3 text-[0.85rem] text-[#8a5a00]" role="status">
	{#if common}Heads up: this is a common password that is easy to guess. Choose something harder to
		guess, like a few unrelated words or a longer phrase.{/if}
</p>

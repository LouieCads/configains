<script lang="ts">
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import { authLabel, requiredMark } from '$lib/features/cms/styles';

	// A password field with a button that shows or hides what was typed. The button sits beside the
	// input, not inside the label, so it never becomes part of the field's accessible name.
	let {
		id,
		name,
		label,
		value = $bindable(''),
		autocomplete,
		placeholder = '',
		minlength,
		maxlength,
		describedby
	}: {
		id: string;
		name: string;
		label: string;
		value?: string;
		autocomplete: 'new-password' | 'current-password';
		placeholder?: string;
		minlength?: number;
		maxlength?: number;
		describedby?: string;
	} = $props();
	let visible = $state(false);
</script>

<div class={authLabel}>
	<label for={id}>{label}<span class={requiredMark} aria-hidden="true">*</span></label>
	<div class="relative">
		<input
			{id}
			{name}
			type={visible ? 'text' : 'password'}
			{autocomplete}
			{placeholder}
			{minlength}
			{maxlength}
			aria-describedby={describedby}
			required
			class="pr-12!"
			bind:value
		/>
		<button
			type="button"
			class="absolute inset-y-0 right-0 grid w-12 cursor-pointer place-items-center rounded-r-[6px] border-0 bg-transparent text-muted hover:text-ink"
			aria-label={visible ? 'Hide password' : 'Show password'}
			aria-pressed={visible}
			onclick={() => (visible = !visible)}
		>
			{#if visible}<EyeOff size={20} aria-hidden="true" />{:else}<Eye
					size={20}
					aria-hidden="true"
				/>{/if}
		</button>
	</div>
</div>

<script lang="ts">
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import Info from '@lucide/svelte/icons/info';
	import X from '@lucide/svelte/icons/x';
	import { flip } from 'svelte/animate';
	import { cubicOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import { toast, type ToastKind } from './toast.svelte';

	const icons = { success: CircleCheck, error: CircleAlert, info: Info } as const;
	const tone: Record<ToastKind, string> = {
		success: 'text-[#175e4d]',
		error: 'text-[#a23131]',
		info: 'text-cyan-ink'
	};

	// Slide in from the right and fade; skip the movement when the visitor prefers less motion.
	const still = () =>
		typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
	const enter = () => ({ x: still() ? 0 : 32, duration: still() ? 0 : 260, easing: cubicOut });
	const leave = () => ({ x: still() ? 0 : 32, duration: still() ? 0 : 180, easing: cubicOut });
	const shift = () => ({ duration: still() ? 0 : 200, easing: cubicOut });
</script>

<div
	class="pointer-events-none fixed right-6 bottom-6 z-70 grid w-[min(calc(100vw-3rem),380px)] gap-2 bp-760:inset-x-4 bp-760:bottom-4 bp-760:w-auto"
>
	{#each toast.items as item (item.id)}
		{@const Icon = icons[item.kind]}
		<div
			class="pointer-events-auto flex items-center gap-3 rounded-[10px] border border-line bg-paper py-2.5 pr-2 pl-4 text-[0.9rem] leading-snug font-semibold text-ink shadow-[0_10px_28px_-14px_rgba(24,42,48,0.45)]"
			role={item.kind === 'error' ? 'alert' : 'status'}
			in:fly={enter()}
			out:fly={leave()}
			animate:flip={shift()}
		>
			<Icon size={18} class="shrink-0 {tone[item.kind]}" aria-hidden="true" />
			<span class="min-w-0 flex-1">{item.text}</span>
			{#if item.action}<a
					class="shrink-0 text-cyan-deep underline-offset-2 hover:underline"
					href={item.action.href}>{item.action.label}</a
				>{/if}
			<button
				type="button"
				class="grid size-8 shrink-0 place-items-center rounded-full border-0 bg-transparent text-muted hover:text-ink"
				aria-label="Dismiss"
				onclick={() => toast.dismiss(item.id)}
			>
				<X size={16} aria-hidden="true" />
			</button>
		</div>
	{/each}
</div>

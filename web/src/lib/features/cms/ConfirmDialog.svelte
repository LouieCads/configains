<!--
	Modal confirmation built on <dialog>. Controlled by `open`; Escape and
	"Keep editing" call `onCancel`. Focus starts on the safe (cancel) action.
-->
<script lang="ts">
	import { dangerSolid, eyebrow, primary, secondary } from './styles';
	let {
		open,
		title,
		message,
		confirmLabel,
		danger = false,
		onConfirm,
		onCancel
	}: {
		open: boolean;
		title: string;
		message: string;
		confirmLabel: string;
		/** Styles the confirm button as destructive. */
		danger?: boolean;
		onConfirm: () => void;
		onCancel: () => void;
	} = $props();
	let dialog: HTMLDialogElement;
	let cancelButton: HTMLButtonElement;
	const id = $props.id();

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) {
			dialog.showModal();
			cancelButton?.focus();
		}
		if (!open && dialog.open) dialog.close();
	});
</script>

<dialog
	bind:this={dialog}
	class="m-auto max-h-[calc(100vh-32px)] w-[min(440px,calc(100vw-32px))] rounded-xl border border-line bg-paper p-0 text-ink [box-shadow:0_24px_70px_#182a3040] backdrop:bg-[#182a30b8]"
	aria-labelledby={`${id}-title`}
	aria-describedby={`${id}-message`}
	oncancel={(event) => {
		event.preventDefault();
		onCancel();
	}}
>
	<div class="p-[30px]">
		<p class={eyebrow}>CONFIGAINS CONTENT STUDIO</p>
		<h2 id={`${id}-title`} class="mt-[10px] mb-4 text-[2.4rem] leading-none">{title}</h2>
		<p id={`${id}-message`} class="m-0 text-muted">{message}</p>
		<div class="mt-7 flex flex-wrap justify-end gap-[10px]">
			<button type="button" class={secondary} bind:this={cancelButton} onclick={onCancel}
				>Keep editing</button
			>
			<button type="button" class={danger ? dangerSolid : primary} onclick={onConfirm}
				>{confirmLabel}</button
			>
		</div>
	</div>
</dialog>

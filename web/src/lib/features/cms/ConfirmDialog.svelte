<!--
	Modal confirmation built on <dialog>. Controlled by `open`; Escape and
	"Keep editing" call `onCancel`. Focus starts on the safe (cancel) action.
-->
<script lang="ts">
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
	class="cms-dialog"
	aria-labelledby={`${id}-title`}
	aria-describedby={`${id}-message`}
	oncancel={(event) => {
		event.preventDefault();
		onCancel();
	}}
>
	<div class="cms-dialog-body">
		<p class="cms-eyebrow">CONFIGAINS CONTENT STUDIO</p>
		<h2 id={`${id}-title`}>{title}</h2>
		<p id={`${id}-message`}>{message}</p>
		<div class="cms-dialog-actions">
			<button type="button" class="cms-secondary" bind:this={cancelButton} onclick={onCancel}
				>Keep editing</button
			>
			<button type="button" class={danger ? 'cms-danger-button' : 'cms-primary'} onclick={onConfirm}
				>{confirmLabel}</button
			>
		</div>
	</div>
</dialog>

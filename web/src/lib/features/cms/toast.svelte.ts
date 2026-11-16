/**
 * Short status messages for the admin. Pages call `toast.success('Saved')` or
 * `toast.error('Could not save')`; `Toaster.svelte` shows them and removes them
 * again. Keep the text to a few words.
 */

import { untrack } from 'svelte';

export type ToastKind = 'success' | 'error' | 'info';
/** `action` adds one short link after the text, e.g. "Open". */
export type ToastAction = { label: string; href: string };
export type Toast = { id: number; kind: ToastKind; text: string; action?: ToastAction };

/** Errors stay longer so they can be read. */
const lifetime: Record<ToastKind, number> = { success: 3500, info: 3500, error: 6500 };
const MAX_VISIBLE = 3;

class ToastStore {
	items = $state<Toast[]>([]);
	#next = 1;
	#timers = new Map<number, ReturnType<typeof setTimeout>>();

	#add(kind: ToastKind, text: string, action?: ToastAction) {
		const message = text.trim();
		if (!message) return;
		// Untracked, so a page effect that raises a toast does not depend on the toast list.
		untrack(() => {
			// Repeating a message that is already showing restarts its timer instead of stacking.
			const same = this.items.find((item) => item.kind === kind && item.text === message);
			if (same) {
				this.#schedule(same);
				return;
			}
			const item: Toast = { id: this.#next++, kind, text: message, action };
			this.items.push(item);
			while (this.items.length > MAX_VISIBLE) this.dismiss(this.items[0].id);
			this.#schedule(item);
		});
	}

	#schedule(item: Toast) {
		clearTimeout(this.#timers.get(item.id));
		this.#timers.set(
			item.id,
			setTimeout(() => this.dismiss(item.id), lifetime[item.kind])
		);
	}

	success = (text: string, action?: ToastAction) => this.#add('success', text, action);
	error = (text: string) => this.#add('error', text);
	info = (text: string) => this.#add('info', text);

	dismiss = (id: number) => {
		clearTimeout(this.#timers.get(id));
		this.#timers.delete(id);
		this.items = this.items.filter((item) => item.id !== id);
	};
}

export const toast = new ToastStore();

import { beforeNavigate, goto } from '$app/navigation';
import { on } from 'svelte/events';

/**
 * Protects unsaved edits while `isDirty()` returns true.
 *
 * Closing or reloading the tab triggers the browser's own warning. In-app
 * navigation is paused instead: `pending` becomes true so the caller can show
 * a confirmation, then call `leave()` to continue or `cancel()` to stay.
 * Must be called during component initialisation.
 */
export function useLeaveGuard(isDirty: () => boolean) {
	let target = $state<string | null>(null);
	let bypass = false;

	beforeNavigate(({ cancel, to, willUnload }) => {
		if (isDirty() && !willUnload && !bypass && to?.url) {
			cancel();
			target = to.url.href;
		}
	});

	$effect(() =>
		on(window, 'beforeunload', (event) => {
			if (!isDirty()) return;
			event.preventDefault();
			event.returnValue = '';
		})
	);

	return {
		get pending() {
			return target !== null;
		},
		cancel() {
			target = null;
		},
		async leave() {
			const destination = target;
			target = null;
			if (!destination) return;
			bypass = true;
			try {
				// This URL came from SvelteKit's own beforeNavigate event.
				// eslint-disable-next-line svelte/no-navigation-without-resolve
				await goto(destination);
			} finally {
				bypass = false;
			}
		}
	};
}

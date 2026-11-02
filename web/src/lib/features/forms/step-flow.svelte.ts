import { untrack } from 'svelte';
import { browserStorage, clearDraft, loadDraft, saveDraft, type DraftStorage } from './draft';
import { controlMessage, type Control, type FieldMessages } from './progress';

export type SaveStatus = 'idle' | 'saving' | 'saved';

export type StepFlowOptions = {
	/** Storage key for this form's draft. */
	key: string;
	/** Number of steps, counting a final review step. */
	steps: number;
	/** Names of the answers kept in the draft. Leave out anything that must be given fresh. */
	fields: string[];
	/** Where drafts are kept; defaults to the browser's local storage. */
	storage?: () => DraftStorage | null;
	/** Pause after the last change before saving, in milliseconds. */
	delay?: number;
	now?: () => number;
};

/**
 * State for a form split into steps, with a draft that saves itself.
 *
 * Bind inputs to `values`. Call `restore()` once the page is in the browser,
 * and call `track()` from an `$effect` so changes are saved. Steps are only
 * validated when moving forward; going back never loses an answer.
 */
export class StepFlow {
	step = $state(0);
	/** Furthest step the visitor may jump to without going through Next. */
	reached = $state(0);
	values = $state<Record<string, string>>({});
	errors = $state<Record<string, string>>({});
	status = $state<SaveStatus>('idle');
	/** True when this visit started from a saved draft. */
	restored = $state(false);
	/** Step to go back to once an edit from the review step is done. */
	returnTo = $state<number | null>(null);

	#steps = $state(1);
	#ready = $state(false);
	#discarded = false;
	#timer: ReturnType<typeof setTimeout> | undefined;
	#lastSaved = '';
	readonly #options: Required<Omit<StepFlowOptions, 'fields'>> & { fields: string[] };

	constructor(options: StepFlowOptions) {
		this.#options = {
			storage: browserStorage,
			delay: 600,
			now: Date.now,
			...options
		};
		this.#steps = Math.max(1, options.steps);
		this.values = Object.fromEntries(options.fields.map((name) => [name, '']));
	}

	/** Zero-based index of the final step. */
	get last() {
		return this.#steps - 1;
	}

	/** Changes the number of steps, for a form whose length depends on an answer. Positions stay in range. */
	setSteps(count: number) {
		this.#steps = Math.max(1, count);
		this.step = Math.min(this.step, this.last);
		this.reached = Math.min(this.reached, this.last);
		if (this.returnTo !== null) this.returnTo = Math.min(this.returnTo, this.last);
	}

	/** True once anything has been entered or the visitor has moved on. */
	get hasProgress() {
		return this.step > 0 || this.reached > 0 || Object.values(this.values).some((v) => v !== '');
	}

	#serialize() {
		return JSON.stringify({
			step: this.step,
			reached: this.reached,
			values: $state.snapshot(this.values)
		});
	}

	/**
	 * Loads a saved draft, if there is one. `allowed` lists the answers each
	 * choice field accepts, so an answer that has since been removed is dropped.
	 */
	restore(allowed: Record<string, readonly string[]> = {}) {
		const draft = loadDraft(this.#options.storage(), this.#options.key, this.#options.now());
		if (draft) {
			for (const name of this.#options.fields) {
				const saved = draft.values[name] ?? '';
				const choices = allowed[name];
				this.values[name] = choices && !choices.includes(saved) ? '' : saved;
			}
			this.step = Math.min(draft.step, this.last);
			this.reached = Math.min(Math.max(draft.reached, this.step), this.last);
			this.restored = this.hasProgress;
		}
		this.#lastSaved = this.#serialize();
		this.#ready = true;
	}

	/** Call from an `$effect`: queues a save whenever an answer or the step changes. */
	track() {
		const current = this.#ready ? this.#serialize() : '';
		untrack(() => {
			if (!this.#ready || this.#discarded || current === this.#lastSaved) return;
			this.status = 'saving';
			clearTimeout(this.#timer);
			this.#timer = setTimeout(() => this.flush(), this.#options.delay);
		});
	}

	/** Saves now. Also used when the page is hidden or closed. */
	flush() {
		clearTimeout(this.#timer);
		this.#timer = undefined;
		if (!this.#ready || this.#discarded) return;
		const storage = this.#options.storage();
		const current = this.#serialize();
		if (!this.hasProgress) {
			clearDraft(storage, this.#options.key);
			this.#lastSaved = current;
			this.status = 'idle';
			return;
		}
		const stored = saveDraft(storage, this.#options.key, {
			v: 1,
			savedAt: this.#options.now(),
			step: this.step,
			reached: this.reached,
			values: $state.snapshot(this.values)
		});
		if (stored) this.#lastSaved = current;
		this.status = stored ? 'saved' : 'idle';
	}

	/** Checks the visible controls inside `root`; shows messages and focuses the first problem. */
	validate(root: ParentNode | null, messages: FieldMessages): boolean {
		const problems: Record<string, string> = {};
		let first: Control | undefined;
		const controls = root?.querySelectorAll<Control>('input, select, textarea') ?? [];
		for (const control of controls) {
			if (!control.name || control.type === 'hidden' || control.disabled) continue;
			const message = controlMessage(control, messages);
			if (!message) continue;
			problems[control.name] = message;
			first ??= control;
		}
		this.errors = problems;
		first?.focus();
		return !first;
	}

	/** Clears a field's message as soon as its answer becomes valid. */
	revalidate(control: Control, messages: FieldMessages) {
		if (control.name in this.errors && controlMessage(control, messages) === null) {
			delete this.errors[control.name];
		}
	}

	#goTo(step: number) {
		this.step = Math.min(Math.max(step, 0), this.last);
		this.errors = {};
		this.restored = false;
	}

	/** Moves forward after the current step passes `validate`; returns whether it moved. */
	next(root: ParentNode | null, messages: FieldMessages): boolean {
		if (!this.validate(root, messages)) return false;
		const from = this.step;
		this.reached = Math.max(this.reached, Math.min(from + 1, this.last));
		const back = this.returnTo;
		this.returnTo = null;
		this.#goTo(back ?? from + 1);
		return true;
	}

	previous() {
		this.returnTo = null;
		this.#goTo(this.step - 1);
	}

	/** Jumps to a step already reached, such as from the progress list. */
	jump(step: number) {
		if (step > this.reached && step > this.step) return;
		this.returnTo = null;
		this.#goTo(step);
	}

	/** Opens a step from the review step and remembers to come back. */
	edit(step: number) {
		this.returnTo = this.step;
		this.#goTo(step);
	}

	/** Stops saving and removes the draft. Use once the form has been sent. */
	discard() {
		clearTimeout(this.#timer);
		this.#timer = undefined;
		this.#discarded = true;
		clearDraft(this.#options.storage(), this.#options.key);
		this.status = 'idle';
	}

	/** Empties every answer, returns to the first step, and removes the draft. */
	reset() {
		clearTimeout(this.#timer);
		this.#timer = undefined;
		for (const name of this.#options.fields) this.values[name] = '';
		this.step = 0;
		this.reached = 0;
		this.errors = {};
		this.returnTo = null;
		this.restored = false;
		this.status = 'idle';
		clearDraft(this.#options.storage(), this.#options.key);
		this.#lastSaved = this.#serialize();
	}
}

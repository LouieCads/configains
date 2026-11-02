import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadDraft, saveDraft, type DraftStorage } from './draft';
import { StepFlow } from './step-flow.svelte';

const KEY = 'test-draft';
const messages = { required: 'Needs an answer.', email: 'Bad email.' };

function memoryStorage(): DraftStorage & { data: Record<string, string> } {
	const data: Record<string, string> = {};
	return {
		data,
		getItem: (key) => data[key] ?? null,
		setItem: (key, value) => {
			data[key] = value;
		},
		removeItem: (key) => {
			delete data[key];
		}
	};
}

/** A step's fields, standing in for the DOM. Each control reports whether it is empty. */
function fakeStep(controls: { name: string; value: string }[]) {
	const items = controls.map(({ name, value }) => ({
		name,
		value,
		type: 'text',
		required: true,
		disabled: false,
		validity: {
			valueMissing: value === '',
			typeMismatch: false,
			patternMismatch: false,
			valid: value !== ''
		},
		focus: vi.fn()
	}));
	return { items, root: { querySelectorAll: () => items } as unknown as ParentNode };
}

let storage: ReturnType<typeof memoryStorage>;
const make = () =>
	new StepFlow({
		key: KEY,
		steps: 4,
		fields: ['name', 'goal'],
		storage: () => storage,
		now: () => 5_000
	});

beforeEach(() => {
	vi.useFakeTimers();
	storage = memoryStorage();
});
afterEach(() => vi.useRealTimers());

describe('StepFlow draft saving', () => {
	it('does not save or show a status before anything is entered', () => {
		const flow = make();
		flow.restore();
		flow.track();
		vi.advanceTimersByTime(5_000);
		expect(flow.status).toBe('idle');
		expect(storage.data[KEY]).toBeUndefined();
	});

	it('shows saving, then saved, and writes the draft after a pause', () => {
		const flow = make();
		flow.restore();
		flow.values.name = 'Ana';
		flow.track();
		expect(flow.status).toBe('saving');
		expect(storage.data[KEY]).toBeUndefined();
		vi.advanceTimersByTime(600);
		expect(flow.status).toBe('saved');
		expect(loadDraft(storage, KEY, 5_000)?.values.name).toBe('Ana');
	});

	it('restarts the pause while the visitor keeps typing', () => {
		const flow = make();
		flow.restore();
		flow.values.name = 'A';
		flow.track();
		vi.advanceTimersByTime(400);
		flow.values.name = 'An';
		flow.track();
		vi.advanceTimersByTime(400);
		expect(flow.status).toBe('saving');
		vi.advanceTimersByTime(200);
		expect(flow.status).toBe('saved');
	});

	it('restores answers and step from a draft', () => {
		saveDraft(storage, KEY, {
			v: 1,
			savedAt: 4_000,
			step: 2,
			reached: 2,
			values: { name: 'Ana', goal: 'Gone' }
		});
		const flow = make();
		flow.restore({ goal: ['Build strength'] });
		expect(flow.values.name).toBe('Ana');
		expect(flow.values.goal).toBe('');
		expect(flow.step).toBe(2);
		expect(flow.restored).toBe(true);
		flow.track();
		expect(flow.status).toBe('idle');
	});

	it('saves when the page is hidden before the pause ends', () => {
		const flow = make();
		flow.restore();
		flow.values.name = 'Ana';
		flow.track();
		flow.flush();
		expect(loadDraft(storage, KEY, 5_000)?.values.name).toBe('Ana');
	});

	it('stops saving and removes the draft once discarded', () => {
		const flow = make();
		flow.restore();
		flow.values.name = 'Ana';
		flow.track();
		vi.advanceTimersByTime(600);
		flow.discard();
		flow.values.name = 'Ana B';
		flow.track();
		vi.advanceTimersByTime(5_000);
		expect(storage.data[KEY]).toBeUndefined();
		expect(flow.status).toBe('idle');
	});

	it('reset empties answers, returns to step one, and removes the draft', () => {
		const flow = make();
		flow.restore();
		flow.values.name = 'Ana';
		flow.step = 2;
		flow.flush();
		flow.reset();
		expect(flow.values).toEqual({ name: '', goal: '' });
		expect(flow.step).toBe(0);
		expect(flow.hasProgress).toBe(false);
		expect(storage.data[KEY]).toBeUndefined();
	});

	it('keeps working without storage', () => {
		const flow = new StepFlow({ key: KEY, steps: 4, fields: ['name'], storage: () => null });
		flow.restore();
		flow.values.name = 'Ana';
		flow.track();
		vi.advanceTimersByTime(600);
		expect(flow.status).toBe('idle');
		expect(flow.values.name).toBe('Ana');
	});
});

describe('StepFlow navigation', () => {
	it('stays on the step and flags empty fields', () => {
		const flow = make();
		const step = fakeStep([
			{ name: 'name', value: '' },
			{ name: 'goal', value: 'Build strength' }
		]);
		expect(flow.next(step.root, messages)).toBe(false);
		expect(flow.step).toBe(0);
		expect(flow.errors).toEqual({ name: messages.required });
		expect(step.items[0].focus).toHaveBeenCalled();
	});

	it('moves forward when the step is valid and clears messages', () => {
		const flow = make();
		const step = fakeStep([{ name: 'name', value: 'Ana' }]);
		expect(flow.next(step.root, messages)).toBe(true);
		expect(flow.step).toBe(1);
		expect(flow.reached).toBe(1);
		expect(flow.errors).toEqual({});
	});

	it('goes back without checking and keeps answers', () => {
		const flow = make();
		flow.values.name = 'Ana';
		flow.next(fakeStep([{ name: 'name', value: 'Ana' }]).root, messages);
		flow.previous();
		expect(flow.step).toBe(0);
		expect(flow.values.name).toBe('Ana');
	});

	it('only jumps to steps already reached', () => {
		const flow = make();
		flow.next(fakeStep([{ name: 'name', value: 'Ana' }]).root, messages);
		flow.jump(3);
		expect(flow.step).toBe(1);
		flow.jump(0);
		expect(flow.step).toBe(0);
		flow.jump(1);
		expect(flow.step).toBe(1);
	});

	it('returns to the review step after editing an answer', () => {
		const flow = make();
		const ok = fakeStep([{ name: 'name', value: 'Ana' }]).root;
		flow.next(ok, messages);
		flow.next(ok, messages);
		flow.next(ok, messages);
		expect(flow.step).toBe(3);
		flow.edit(1);
		expect(flow.step).toBe(1);
		expect(flow.returnTo).toBe(3);
		flow.next(ok, messages);
		expect(flow.step).toBe(3);
		expect(flow.returnTo).toBeNull();
	});

	it('keeps positions in range when the number of steps shrinks', () => {
		const flow = make();
		const ok = fakeStep([{ name: 'name', value: 'Ana' }]).root;
		flow.next(ok, messages);
		flow.next(ok, messages);
		flow.next(ok, messages);
		flow.edit(0);
		flow.setSteps(3);
		expect(flow.last).toBe(2);
		expect(flow.step).toBe(0);
		expect(flow.reached).toBe(2);
		expect(flow.returnTo).toBe(2);
		flow.setSteps(4);
		expect(flow.last).toBe(3);
	});

	it('drops a field message once the answer is valid', () => {
		const flow = make();
		flow.next(fakeStep([{ name: 'name', value: '' }]).root, messages);
		const fixed = fakeStep([{ name: 'name', value: 'Ana' }]).items[0];
		flow.revalidate(fixed as unknown as HTMLInputElement, messages);
		expect(flow.errors).toEqual({});
	});
});

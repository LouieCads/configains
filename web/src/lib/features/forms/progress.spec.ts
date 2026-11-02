import { describe, expect, it } from 'vitest';
import { controlMessage, fillTemplate, percentComplete } from './progress';

const messages = { required: 'Needs an answer.', email: 'Bad email.' };
const validity = (flags: Partial<ValidityState> = {}) =>
	({
		valueMissing: false,
		typeMismatch: false,
		patternMismatch: false,
		valid: true,
		...flags
	}) as ValidityState;

describe('percentComplete', () => {
	it('is the share of steps finished, not counting the current one', () => {
		expect(percentComplete(1, 4)).toBe(0);
		expect(percentComplete(2, 5)).toBe(20);
		expect(percentComplete(4, 4)).toBe(75);
	});

	it('stays within range for odd input', () => {
		expect(percentComplete(0, 4)).toBe(0);
		expect(percentComplete(9, 4)).toBe(75);
		expect(percentComplete(1, 0)).toBe(0);
	});
});

describe('fillTemplate', () => {
	it('fills known placeholders and leaves unknown ones', () => {
		expect(fillTemplate('Step {current} of {total} {nope}', { current: 2, total: 4 })).toBe(
			'Step 2 of 4 {nope}'
		);
	});
});

describe('controlMessage', () => {
	it('flags an empty required field', () => {
		const control = { required: true, value: '', type: 'text', validity: validity() };
		expect(controlMessage(control, messages)).toBe(messages.required);
	});

	it('treats spaces as empty', () => {
		const control = { required: true, value: '   ', type: 'text', validity: validity() };
		expect(controlMessage(control, messages)).toBe(messages.required);
	});

	it('uses the browser verdict for a missing choice', () => {
		const control = {
			required: true,
			value: '',
			type: 'select-one',
			validity: validity({ valueMissing: true, valid: false })
		};
		expect(controlMessage(control, messages)).toBe(messages.required);
	});

	it('uses the email message for a malformed address', () => {
		const control = {
			required: true,
			value: 'ana@',
			type: 'email',
			validity: validity({ typeMismatch: true, valid: false })
		};
		expect(controlMessage(control, messages)).toBe(messages.email);
	});

	it('accepts a valid field and an unchecked box that is not required', () => {
		expect(
			controlMessage({ required: true, value: 'Ana', type: 'text', validity: validity() }, messages)
		).toBeNull();
		expect(
			controlMessage(
				{ required: false, value: '', type: 'checkbox', validity: validity() },
				messages
			)
		).toBeNull();
	});
});

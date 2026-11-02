/**
 * Share of the form finished, as a whole percent. The step being filled in does
 * not count yet, so the first step is 0% and step 2 of 5 is 20%. The form is only
 * complete once it is sent.
 */
export function percentComplete(step: number, total: number): number {
	if (total <= 0) return 0;
	const current = Math.min(Math.max(step, 1), total);
	return Math.round(((current - 1) / total) * 100);
}

/** Replaces `{name}` placeholders with values; unknown placeholders stay as written. */
export function fillTemplate(template: string, values: Record<string, string | number>): string {
	return template.replace(/\{(\w+)\}/g, (match, key: string) =>
		key in values ? String(values[key]) : match
	);
}

export type FieldMessages = {
	required: string;
	email: string;
};

/** The kinds of form control the step validator reads. */
export type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/**
 * The error message for a control, or `null` when it is valid. Text fields that
 * hold only spaces count as empty.
 */
export function controlMessage(
	control: Pick<Control, 'required' | 'value' | 'type' | 'validity'>,
	messages: FieldMessages
): string | null {
	const blankText =
		control.required &&
		control.type !== 'checkbox' &&
		control.type !== 'radio' &&
		control.value.trim() === '';
	if (blankText || control.validity.valueMissing) return messages.required;
	if (control.validity.typeMismatch || control.validity.patternMismatch) {
		return control.type === 'email' ? messages.email : messages.required;
	}
	return control.validity.valid ? null : messages.required;
}

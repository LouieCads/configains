import { env } from '$env/dynamic/private';
import type { Selector } from '$lib/coaching/selection';
import { geminiSelector } from './gemini';

/** Model for program selection. Confirm the current Flash-Lite model ID before going live. */
export const defaultModel = 'gemini-2.5-flash-lite';

/** Returns the configured selector, or null when no key is set, so rules-only matching still works. */
export function configuredSelector(): { selector: Selector; model: string } | null {
	const apiKey = env.AI_API_KEY;
	if (!apiKey) return null;
	const model = env.AI_MODEL || defaultModel;
	return { selector: geminiSelector({ apiKey, model }), model };
}

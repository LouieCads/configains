import { describe, expect, it } from 'vitest';
import { geminiSelector } from './gemini';

const request = {
	goal: 'fat_loss',
	experience: 'beginner',
	training_location: 'home',
	days_per_week: 3,
	workouts: [{ id: 'w1', name: 'Home foundations', description: null }],
	nutrition: []
};

function replying(body: unknown, status = 200) {
	const calls: { url: string; init: RequestInit }[] = [];
	const fetchImpl = async (url: string, init: RequestInit) => {
		calls.push({ url, init });
		return new Response(JSON.stringify(body), { status });
	};
	return { calls, fetchImpl };
}

const modelReply = (text: string) => ({ candidates: [{ content: { parts: [{ text }] } }] });

describe('geminiSelector', () => {
	it('sends the key in a header and returns the parsed JSON choice', async () => {
		const { calls, fetchImpl } = replying(
			modelReply('{"workout_id":"w1","nutrition_id":null,"explanation":"Fits."}')
		);
		const selector = geminiSelector({ apiKey: 'test-key', model: 'gemini-test', fetchImpl });

		expect(await selector(request)).toEqual({
			workout_id: 'w1',
			nutrition_id: null,
			explanation: 'Fits.'
		});
		expect(calls[0].url).toContain('/models/gemini-test:generateContent');
		expect(new Headers(calls[0].init.headers).get('x-goog-api-key')).toBe('test-key');
		// The key must not appear in the URL or the request body.
		expect(calls[0].url).not.toContain('test-key');
		expect(String(calls[0].init.body)).not.toContain('test-key');
	});

	it('throws on an HTTP error so the caller can fall back', async () => {
		const { fetchImpl } = replying({ error: 'quota' }, 429);
		const selector = geminiSelector({ apiKey: 'k', model: 'm', fetchImpl });
		await expect(selector(request)).rejects.toThrow('status 429');
	});

	it('throws when the reply has no text', async () => {
		const { fetchImpl } = replying({ candidates: [] });
		const selector = geminiSelector({ apiKey: 'k', model: 'm', fetchImpl });
		await expect(selector(request)).rejects.toThrow('no text');
	});
});

import type { Selector, SelectionRequest } from '$lib/coaching/selection';

const instructions = [
	'You choose one approved fitness program for a client from the candidate lists you are given,',
	'and explain the choice in two or three plain sentences addressed to the client.',
	'Choose only ids that appear in the lists. Do not invent exercises, programs or nutrition advice.',
	'Describe the programs as general fitness and wellness guidance. Never give medical advice or diagnoses.',
	'Reply only with the JSON object requested.'
].join(' ');

const responseSchema = {
	type: 'OBJECT',
	properties: {
		workout_id: { type: 'STRING' },
		nutrition_id: { type: 'STRING', nullable: true },
		explanation: { type: 'STRING' }
	},
	required: ['workout_id', 'explanation']
};

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

/** Selector backed by Gemini's generateContent API. Errors are thrown and handled by chooseProgram. */
export function geminiSelector({
	apiKey,
	model,
	fetchImpl = fetch as FetchLike
}: {
	apiKey: string;
	model: string;
	fetchImpl?: FetchLike;
}): Selector {
	return async (request: SelectionRequest) => {
		const response = await fetchImpl(
			`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
			{
				method: 'POST',
				headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
				body: JSON.stringify({
					systemInstruction: { parts: [{ text: instructions }] },
					contents: [{ role: 'user', parts: [{ text: JSON.stringify(request) }] }],
					generationConfig: {
						responseMimeType: 'application/json',
						responseSchema,
						temperature: 0.2,
						maxOutputTokens: 400
					}
				}),
				signal: AbortSignal.timeout(10_000)
			}
		);
		if (!response.ok) throw new Error(`Model request failed with status ${response.status}.`);

		const body = (await response.json()) as {
			candidates?: { content?: { parts?: { text?: string }[] } }[];
		};
		const text = body.candidates?.[0]?.content?.parts?.[0]?.text;
		if (typeof text !== 'string') throw new Error('Model returned no text.');
		return JSON.parse(text) as unknown;
	};
}

export type Candidate = { id: string; name: string; description: string | null };

/** What the model may see. Health answers and sex are left out; the candidates already reflect them. */
export type SelectionRequest = {
	goal: string;
	experience: string;
	training_location: string;
	days_per_week: number;
	workouts: Candidate[];
	nutrition: Candidate[];
};

export type Selector = (request: SelectionRequest) => Promise<unknown>;

export type Selection = {
	workoutId: string;
	nutritionId: string | null;
	explanation: string;
	source: 'ai' | 'rules';
};

export const maxExplanationLength = 500;

const rulesExplanation =
	'This program fits your goal, experience, training location and weekly schedule. Cash approved it for that profile.';

/** Accepts the model's answer only if it names candidates from the list and has a usable explanation. */
export function parseSelection(raw: unknown, request: SelectionRequest) {
	if (!raw || typeof raw !== 'object') return null;
	const reply = raw as Record<string, unknown>;
	const workoutIds = request.workouts.map((candidate) => candidate.id);
	const nutritionIds = request.nutrition.map((candidate) => candidate.id);

	if (typeof reply.workout_id !== 'string' || !workoutIds.includes(reply.workout_id)) return null;
	const nutritionId = typeof reply.nutrition_id === 'string' ? reply.nutrition_id : null;
	if (nutritionIds.length > 0 && (!nutritionId || !nutritionIds.includes(nutritionId))) return null;
	if (nutritionIds.length === 0 && nutritionId) return null;

	const explanation = typeof reply.explanation === 'string' ? reply.explanation.trim() : '';
	if (!explanation || explanation.length > maxExplanationLength) return null;

	return { workoutId: reply.workout_id, nutritionId, explanation };
}

/**
 * Picks the program. The model is optional and any failure falls back to the first rule match,
 * so a client never waits on a model error or gets an unapproved program.
 */
export async function chooseProgram(
	request: SelectionRequest,
	selector: Selector | null
): Promise<Selection> {
	if (request.workouts.length === 0) throw new Error('No eligible workout templates.');
	const fallback: Selection = {
		workoutId: request.workouts[0].id,
		nutritionId: request.nutrition[0]?.id ?? null,
		explanation: rulesExplanation,
		source: 'rules'
	};
	if (!selector) return fallback;

	try {
		const parsed = parseSelection(await selector(request), request);
		return parsed ? { ...parsed, source: 'ai' } : fallback;
	} catch {
		return fallback;
	}
}

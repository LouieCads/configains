import type { SupabaseClient } from '@supabase/supabase-js';
import type { Answers } from '$lib/coaching/assessment';
import { eligiblePrograms, type MatchableTemplate } from '$lib/coaching/matching';
import { aiDisclosureVersion } from '$lib/coaching/disclosure';
import { chooseProgram, type Candidate, type Selector } from '$lib/coaching/selection';

export type MatchOutcome = 'ai_matched' | 'needs_human_review' | 'human_assigned' | 'not_pending';

type MatchInput = {
	/** The client's own session. Row-level security confirms the assessment belongs to them. */
	session: SupabaseClient;
	/** Service-role client. Reads the template library, which clients cannot see, and writes results. */
	admin: SupabaseClient;
	clientId: string;
	assessmentId: string;
	selector: Selector | null;
	modelName: string;
};

const candidate = (template: MatchableTemplate): Candidate => ({
	id: template.id,
	name: template.name,
	description: template.description ?? null
});

async function markReview(
	admin: SupabaseClient,
	assessmentId: string,
	status: 'needs_human_review' | 'human_assigned'
) {
	const { error } = await admin.from('assessments').update({ status }).eq('id', assessmentId);
	if (error) throw error;
}

/**
 * Turns a submitted assessment into an AI Coaching program, or routes it to Cash.
 * Red flags, human-coached clients, clients with an active program and no-match cases never get an AI plan.
 */
export async function runAiMatching(input: MatchInput): Promise<MatchOutcome> {
	const { session, admin, clientId, assessmentId, selector, modelName } = input;

	const { data: assessment, error: assessmentError } = await session
		.from('assessments')
		.select('id, answers, red_flags, status')
		.eq('id', assessmentId)
		.eq('client_id', clientId)
		.maybeSingle();
	if (assessmentError) throw assessmentError;
	if (!assessment) throw new Error('Assessment not found for this client.');
	if (assessment.status !== 'submitted') return 'not_pending';

	const { data: profile, error: profileError } = await admin
		.from('client_profiles')
		.select('coaching_mode')
		.eq('id', clientId)
		.maybeSingle();
	if (profileError) throw profileError;
	if (profile?.coaching_mode === 'human') {
		await markReview(admin, assessmentId, 'human_assigned');
		return 'human_assigned';
	}

	if ((assessment.red_flags as string[]).length > 0) {
		await markReview(admin, assessmentId, 'needs_human_review');
		return 'needs_human_review';
	}

	const { data: active, error: activeError } = await admin
		.from('client_programs')
		.select('id')
		.eq('client_id', clientId)
		.eq('status', 'active')
		.maybeSingle();
	if (activeError) throw activeError;
	if (active) {
		await markReview(admin, assessmentId, 'needs_human_review');
		return 'needs_human_review';
	}

	const { data: templates, error: templatesError } = await admin
		.from('program_templates')
		.select('id, kind, goal, name, description, rules')
		.eq('is_archived', false);
	if (templatesError) throw templatesError;

	const answers = assessment.answers as Answers;
	const eligible = eligiblePrograms(answers, (templates ?? []) as MatchableTemplate[]);
	if (eligible.workouts.length === 0) {
		await markReview(admin, assessmentId, 'needs_human_review');
		return 'needs_human_review';
	}

	const selection = await chooseProgram(
		{
			goal: answers.goal,
			experience: answers.experience,
			training_location: answers.training_location,
			days_per_week: answers.days_per_week,
			workouts: eligible.workouts.slice(0, 10).map(candidate),
			nutrition: eligible.nutrition.slice(0, 10).map(candidate)
		},
		selector
	);

	const { data: firstPhase, error: phaseError } = await admin
		.from('template_phases')
		.select('id')
		.eq('template_id', selection.workoutId)
		.order('position')
		.limit(1)
		.maybeSingle();
	if (phaseError) throw phaseError;

	const { error: recommendationError } = await admin.from('ai_recommendations').insert({
		assessment_id: assessmentId,
		workout_template_id: selection.workoutId,
		nutrition_template_id: selection.nutritionId,
		explanation: selection.explanation,
		model: selection.source === 'ai' ? modelName : 'rules',
		disclosure_version: aiDisclosureVersion
	});
	if (recommendationError) throw recommendationError;

	const { error: programError } = await admin.from('client_programs').insert({
		client_id: clientId,
		assessment_id: assessmentId,
		workout_template_id: selection.workoutId,
		nutrition_template_id: selection.nutritionId,
		current_phase_id: firstPhase?.id ?? null,
		source: 'ai',
		status: 'active'
	});
	if (programError) {
		// Remove the recommendation so a retry starts clean.
		await admin.from('ai_recommendations').delete().eq('assessment_id', assessmentId);
		throw programError;
	}

	const { error: statusError } = await admin
		.from('assessments')
		.update({ status: 'ai_matched' })
		.eq('id', assessmentId);
	if (statusError) throw statusError;
	return 'ai_matched';
}

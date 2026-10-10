import type { SupabaseClient } from '@supabase/supabase-js';
import type { ExerciseInput, PhaseInput, TemplateInput } from '$lib/coaching/template';

type ExerciseRow = ExerciseInput & { id: string; position: number };
type PhaseRow = Omit<PhaseInput, 'exercises'> & {
	id: string;
	position: number;
	template_exercises: ExerciseRow[];
};

const exerciseColumns = 'id, position, name, sets, reps, rest_seconds, notes';
const phaseColumns = `id, position, name, instructions, template_exercises(${exerciseColumns})`;

function byPosition<T extends { position: number }>(rows: T[] | null | undefined): T[] {
	return [...(rows ?? [])].sort((a, b) => a.position - b.position);
}

function toExerciseInput({
	id,
	name,
	sets,
	reps,
	rest_seconds,
	notes
}: ExerciseRow): ExerciseInput {
	return { id, name, sets, reps, rest_seconds, notes };
}

/** Turns nested rows from PostgREST into the editor's shape, sorted by position. */
export function phasesFromRows(rows: PhaseRow[] | null | undefined) {
	return byPosition(rows).map((phase) => ({
		id: phase.id,
		name: phase.name,
		instructions: phase.instructions,
		exercises: byPosition(phase.template_exercises).map(toExerciseInput)
	}));
}

export async function listTemplates(supabase: SupabaseClient) {
	const { data, error } = await supabase
		.from('program_templates')
		.select('id, kind, goal, name, is_archived, updated_at')
		.order('name');
	if (error) throw error;
	return data ?? [];
}

export async function loadTemplate(supabase: SupabaseClient, id: string) {
	const { data, error } = await supabase
		.from('program_templates')
		.select(
			`id, kind, goal, name, description, is_archived, rules, template_phases(${phaseColumns})`
		)
		.eq('id', id)
		.maybeSingle();
	if (error) throw error;
	if (!data) return null;
	const template: TemplateInput = {
		id: data.id,
		kind: data.kind,
		goal: data.goal,
		name: data.name,
		description: data.description,
		is_archived: data.is_archived,
		rules: data.rules ?? {},
		phases: phasesFromRows(data.template_phases)
	};
	return template;
}

/** Saves the whole template in one database transaction. Returns the template id. */
export async function saveTemplate(supabase: SupabaseClient, template: TemplateInput) {
	const { data, error } = await supabase.rpc('save_program_template', { payload: template });
	if (error)
		return {
			ok: false as const,
			message: 'The template could not be saved. Check the fields and try again.'
		};
	return { ok: true as const, id: data as string };
}

/** Assigns a template pair to a client. The database ends their previous active program. */
export async function assignProgram(
	supabase: SupabaseClient,
	clientId: string,
	workoutTemplateId: string,
	nutritionTemplateId: string | null
) {
	const { error } = await supabase.rpc('assign_client_program', {
		p_client_id: clientId,
		p_workout_template_id: workoutTemplateId,
		p_nutrition_template_id: nutritionTemplateId
	});
	if (!error) return { ok: true as const };
	// Messages from the database for archived or missing templates are written for coaches.
	return {
		ok: false as const,
		message:
			error.code === '22023' ? error.message : 'The program could not be assigned. Try again.'
	};
}

const programColumns = `id, source, assessment_id, current_phase_id,
	workout:program_templates!workout_template_id(id, name, description, template_phases(${phaseColumns})),
	nutrition:program_templates!nutrition_template_id(id, name, description, template_phases(${phaseColumns}))`;

export async function loadActiveProgram(supabase: SupabaseClient, clientId: string) {
	const { data, error } = await supabase
		.from('client_programs')
		.select(programColumns)
		.eq('client_id', clientId)
		.eq('status', 'active')
		.maybeSingle();
	if (error) throw error;
	if (!data) return null;

	const shape = (
		template: {
			id: string;
			name: string;
			description: string | null;
			template_phases: PhaseRow[];
		} | null
	) =>
		template
			? {
					id: template.id,
					name: template.name,
					description: template.description,
					phases: phasesFromRows(template.template_phases)
				}
			: null;

	// The AI explanation is only readable for the client's own recommendation (row-level security).
	let explanation: string | null = null;
	if (data.source === 'ai' && data.assessment_id) {
		const { data: recommendation } = await supabase
			.from('ai_recommendations')
			.select('explanation, disclosure_version')
			.eq('assessment_id', data.assessment_id)
			.maybeSingle();
		explanation = recommendation?.explanation ?? null;
	}

	return {
		id: data.id,
		source: data.source as 'ai' | 'coach',
		explanation,
		currentPhaseId: data.current_phase_id as string | null,
		workout: shape(data.workout as never),
		nutrition: shape(data.nutrition as never)
	};
}

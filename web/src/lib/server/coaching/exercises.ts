import type { SupabaseClient } from '@supabase/supabase-js';
import { demoFrom, type ExerciseDemo } from '$lib/coaching/demo';

export type LibraryExercise = {
	id: string;
	name: string;
	youtube_id: string | null;
	media_path: string | null;
	media_kind: 'image' | 'video' | null;
	updated_at: string;
	demo: ExerciseDemo | null;
	/** How many template exercises link to this entry. */
	uses: number;
};

/** Names for the template editor's suggestions. An unreadable library just means no suggestions. */
export async function listLibraryNames(supabase: SupabaseClient): Promise<string[]> {
	const { data, error } = await supabase.from('exercise_library').select('name').order('name');
	if (error) return [];
	return (data ?? []).map((row) => row.name as string);
}

export async function listLibrary(supabase: SupabaseClient): Promise<LibraryExercise[]> {
	const { data, error } = await supabase
		.from('exercise_library')
		.select('id, name, youtube_id, media_path, media_kind, updated_at, template_exercises(count)')
		.order('name');
	if (error) throw error;
	return (data ?? []).map(({ template_exercises, ...row }) => ({
		...(row as Omit<LibraryExercise, 'demo' | 'uses'>),
		demo: demoFrom(row),
		uses: (template_exercises as { count: number }[] | null)?.[0]?.count ?? 0
	}));
}

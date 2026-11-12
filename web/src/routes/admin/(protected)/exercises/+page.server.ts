import { fail } from '@sveltejs/kit';
import { mediaKindOf, parseYoutubeId, validMediaPath } from '$lib/coaching/demo';
import { cleanText, isUuid } from '$lib/coaching/text';
import { requireAdmin } from '$lib/server/auth/admin';
import { requireSameOrigin } from '$lib/server/auth/origin';
import { listLibrary, type LibraryExercise } from '$lib/server/coaching/exercises';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (event.locals.localAdminDemo) {
		await requireAdmin(event);
		return { exercises: [] as LibraryExercise[], loadError: null, localDemo: true };
	}
	const [, result] = await Promise.all([
		requireAdmin(event),
		listLibrary(event.locals.supabase).then(
			(exercises) => ({ exercises, loadError: null }),
			() => ({
				exercises: [] as LibraryExercise[],
				loadError: 'The exercise library could not be loaded. Please try again.'
			})
		)
	]);
	return { ...result, localDemo: false };
};

export const actions = {
	save: async (event) => {
		requireSameOrigin(event);
		await requireAdmin(event);
		const form = await event.request.formData();
		const id = String(form.get('id') ?? '');
		const name = cleanText(form.get('name'), 120);
		const youtubeInput = String(form.get('youtube') ?? '').trim();
		const mediaPath = String(form.get('media_path') ?? '').trim();
		const values = { id, name, youtube: youtubeInput };

		if (id && !isUuid(id)) return fail(400, { ...values, message: 'The exercise was not found.' });
		if (!name) return fail(400, { ...values, message: 'Enter the exercise name.' });
		const youtubeId = youtubeInput ? parseYoutubeId(youtubeInput) : null;
		if (youtubeInput && !youtubeId)
			return fail(400, {
				...values,
				message: 'Paste a YouTube video link, for example https://youtu.be/…'
			});
		if (mediaPath && !validMediaPath(mediaPath))
			return fail(400, { ...values, message: 'Upload the demo clip again.' });

		const row = {
			name,
			youtube_id: youtubeId,
			media_path: mediaPath || null,
			media_kind: mediaPath ? mediaKindOf(mediaPath) : null
		};
		const { error } = id
			? await event.locals.supabase.from('exercise_library').update(row).eq('id', id)
			: await event.locals.supabase.from('exercise_library').insert(row);
		if (error)
			return fail(400, {
				...values,
				message:
					error.code === '23505'
						? 'An exercise with that name is already in the library.'
						: 'The exercise could not be saved. Try again.'
			});
		return { saved: name };
	},

	delete: async (event) => {
		requireSameOrigin(event);
		await requireAdmin(event);
		const id = String((await event.request.formData()).get('id') ?? '');
		if (!isUuid(id)) return fail(400, { message: 'The exercise was not found.' });
		// Program exercises keep their names; they only lose the demonstration.
		const { error } = await event.locals.supabase.from('exercise_library').delete().eq('id', id);
		if (error) return fail(400, { message: 'The exercise could not be deleted. Try again.' });
		return { deleted: true };
	}
} satisfies Actions;

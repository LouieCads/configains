import { readWebsite } from '$lib/server/website';
export const load = async ({ locals }) => {
	const [draft, published] = await Promise.all([
		readWebsite(locals.supabase, true),
		readWebsite(locals.supabase)
	]);
	return {
		content: draft.revision ? draft.content : published.content,
		revision: draft.revision,
		publishedRevision: published.revision,
		unavailable: Boolean(draft.error || published.error)
	};
};

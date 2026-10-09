import { readEditableWebsite } from '$lib/server/website';

export const load = async ({ locals }) => readEditableWebsite(locals.supabase);

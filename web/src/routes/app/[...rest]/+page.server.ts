import { redirect } from '@sveltejs/kit';
import { requireClient } from '$lib/server/auth/client';
import type { PageServerLoad } from './$types';

// A mistyped or retired client page (for example an old bookmark). Specific /app routes match first,
// so this only catches the rest. Signed-out visitors go to sign-in; clients land on their plan.
export const load: PageServerLoad = async (event) => {
	await requireClient(event);
	redirect(303, '/app');
};

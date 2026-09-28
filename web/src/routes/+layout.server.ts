export const load = async ({ locals }) => {
	const { session } = await locals.safeGetSession();
	return { session };
};

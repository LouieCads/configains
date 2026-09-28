import { requireAdmin } from '$lib/server/auth/admin';

export const load = async (event) => {
	const { user, profile } = await requireAdmin(event);
	return { user, profile };
};

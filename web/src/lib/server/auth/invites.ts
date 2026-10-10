import type { SupabaseClient } from '@supabase/supabase-js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validInviteEmail(email: unknown): email is string {
	return typeof email === 'string' && email.length <= 254 && emailPattern.test(email);
}

type InviteInput = {
	/** Service-role client: only place that can create auth users. Server-only. */
	admin: SupabaseClient;
	/** The coach's own session client. Its RLS checks that the caller is an administrator. */
	coach: SupabaseClient;
	email: string;
	displayName: string | null;
	redirectTo: string;
};

/**
 * Invites a client by email and creates their profile in `client_profiles`.
 * If the profile write fails, the new auth user is removed so the invitation can be sent again.
 */
export async function inviteClient({ admin, coach, email, displayName, redirectTo }: InviteInput) {
	const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
	if (error || !data.user) {
		return {
			ok: false as const,
			message:
				error?.code === 'email_exists' || error?.message?.includes('already been registered')
					? 'That email already has a Configains account.'
					: 'The invitation could not be sent. Check the address and try again.'
		};
	}

	const userId = data.user.id;
	const { error: profileError } = await coach
		.from('client_profiles')
		.insert({ id: userId, display_name: displayName });
	if (profileError) {
		await admin.auth.admin.deleteUser(userId);
		return { ok: false as const, message: 'The client profile could not be created. Try again.' };
	}
	return { ok: true as const, userId };
}

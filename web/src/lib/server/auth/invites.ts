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
	// Supabase re-sends the invite when the address was invited before but never accepted. That
	// client already has a profile: keep it, and never remove their auth user.
	const { data: existing } = await coach
		.from('client_profiles')
		.select('id')
		.eq('id', userId)
		.maybeSingle();
	if (existing) return { ok: true as const, userId, resent: true };

	const { error: profileError } = await coach
		.from('client_profiles')
		.insert({ id: userId, display_name: displayName });
	if (profileError) {
		await admin.auth.admin.deleteUser(userId);
		return { ok: false as const, message: 'The client profile could not be created. Try again.' };
	}
	return { ok: true as const, userId, resent: false };
}

export type InviteState = { email: string | null; accepted: boolean };

/** Email and whether the client has accepted their invitation. Null when it cannot be read. */
export async function inviteState(
	admin: SupabaseClient,
	userId: string
): Promise<InviteState | null> {
	const { data, error } = await admin.auth.admin.getUserById(userId);
	if (error || !data.user) return null;
	return { email: data.user.email ?? null, accepted: Boolean(data.user.email_confirmed_at) };
}

/**
 * Sends a fresh invitation link to an existing client who has not accepted yet, for example
 * after the first link expired. The account, profile and any program stay as they are.
 */
export async function resendInvite(admin: SupabaseClient, userId: string, redirectTo: string) {
	const state = await inviteState(admin, userId);
	if (!state?.email)
		return { ok: false as const, message: 'The client account could not be found.' };
	if (state.accepted)
		return {
			ok: false as const,
			message: 'This client has already accepted their invitation and set a password.'
		};
	const { error } = await admin.auth.admin.inviteUserByEmail(state.email, { redirectTo });
	if (error)
		return {
			ok: false as const,
			message:
				error.status === 429
					? 'Too many emails were sent recently. Wait a few minutes and try again.'
					: 'The invitation could not be sent. Try again.'
		};
	return { ok: true as const, email: state.email };
}

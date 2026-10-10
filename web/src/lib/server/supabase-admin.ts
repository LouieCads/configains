import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';

/**
 * Service-role client for auth admin calls such as sending invitations.
 * Server-only: the key is read from a private env var and must never be prefixed with PUBLIC_.
 */
export function createServiceClient(): SupabaseClient {
	const key = env.SUPABASE_SERVICE_ROLE_KEY;
	if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured.');
	return createClient(PUBLIC_SUPABASE_URL, key, {
		auth: { autoRefreshToken: false, persistSession: false }
	});
}

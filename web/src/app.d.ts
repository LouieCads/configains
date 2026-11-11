import type { SupabaseClient } from '@supabase/supabase-js';

declare global {
	namespace App {
		/** The signed-in user, taken from the verified access token. */
		interface AuthUser {
			id: string;
			email: string | null;
		}
		interface Locals {
			localAdminDemo: boolean;
			supabase: SupabaseClient;
			safeGetUser: () => Promise<{ user: AuthUser | null }>;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};

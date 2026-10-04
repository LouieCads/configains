import type { SupabaseClient, User } from '@supabase/supabase-js';

declare global {
	namespace App {
		interface Locals {
			localAdminDemo: boolean;
			supabase: SupabaseClient;
			safeGetUser: () => Promise<{ user: User | null }>;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};

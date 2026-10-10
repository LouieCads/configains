import { describe, expect, it } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { requireClient } from './client';

type Profile = { id: string; display_name: string | null; coaching_mode: 'ai' | 'human' } | null;

function event(path: string, user: { id: string } | null, profile: Profile) {
	const supabase = {
		from: (table: string) => {
			expect(table).toBe('client_profiles');
			return {
				select: () => ({
					eq: (column: string, value: string) => {
						expect(column).toBe('id');
						expect(value).toBe(user?.id);
						return { maybeSingle: async () => ({ data: profile, error: null }) };
					}
				})
			};
		}
	};
	return {
		url: new URL(`https://configains.fundrstudio.com${path}`),
		locals: {
			supabase,
			safeGetUser: async () => ({ user })
		}
	} as unknown as RequestEvent;
}

async function thrownBy(run: () => Promise<unknown>) {
	try {
		await run();
	} catch (thrown) {
		return thrown as { status: number; location?: string; body?: { message: string } };
	}
	throw new Error('Expected requireClient to throw');
}

describe('client account guard', () => {
	it('returns the signed-in client profile', async () => {
		const profile = { id: 'client-1', display_name: 'Sam', coaching_mode: 'ai' as const };
		const result = await requireClient(event('/app', { id: 'client-1' }, profile));
		expect(result.profile).toEqual(profile);
		expect(result.user.id).toBe('client-1');
	});

	it('redirects a visitor page request to sign-in', async () => {
		const thrown = await thrownBy(() => requireClient(event('/app/program', null, null)));
		expect(thrown.status).toBe(303);
		expect(thrown.location).toBe('/login?redirectTo=%2Fapp%2Fprogram');
	});

	it('returns 401 for a visitor API request', async () => {
		const thrown = await thrownBy(() =>
			requireClient(event('/api/coaching/recommend', null, null))
		);
		expect(thrown.status).toBe(401);
	});

	it('returns 403 for a signed-in user without a client profile', async () => {
		const thrown = await thrownBy(() =>
			requireClient(event('/api/coaching/recommend', { id: 'admin-1' }, null))
		);
		expect(thrown.status).toBe(403);
	});
});

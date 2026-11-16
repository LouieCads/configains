import { describe, expect, it, vi } from 'vitest';
import { actions, load } from './+page.server';

const origin = 'https://configains.fundrstudio.com';

function loginEvent(options: { search?: string; user?: { id: string } | null; client?: boolean }) {
	const { search = '', user = null, client = true } = options;
	const signInWithPassword = vi.fn().mockResolvedValue({ error: null });
	const signOut = vi.fn().mockResolvedValue({ error: null });
	const supabase = {
		auth: {
			signInWithPassword,
			signOut,
			getUser: async () => ({ data: { user: { id: 'client-1' } } })
		},
		from: () => ({
			select: () => ({
				eq: () => ({ maybeSingle: async () => ({ data: client ? { id: 'client-1' } : null }) })
			})
		})
	};
	return {
		signInWithPassword,
		signOut,
		event: {
			url: new URL(`${origin}/login${search}`),
			request: new Request(`${origin}/login${search}`, {
				method: 'POST',
				headers: { origin, 'content-type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({ email: 'sam@example.com', password: 'secret-password' })
			}),
			locals: { supabase, safeGetUser: async () => ({ user }) }
		}
	};
}

const run = (event: unknown) => actions.default(event as Parameters<typeof actions.default>[0]);
const loadPage = (event: unknown) => load(event as Parameters<typeof load>[0]);

describe('client sign in', () => {
	it('sends a client to their dashboard after signing in', async () => {
		await expect(run(loginEvent({}).event)).rejects.toMatchObject({
			status: 303,
			location: '/app'
		});
	});

	it('returns a client to the page that asked them to sign in', async () => {
		await expect(
			run(loginEvent({ search: '?redirectTo=%2Fapp%2Flog' }).event)
		).rejects.toMatchObject({ status: 303, location: '/app/log' });
	});

	it('ignores a redirect that leaves the client area', async () => {
		await expect(
			run(loginEvent({ search: '?redirectTo=https%3A%2F%2Fevil.example' }).event)
		).rejects.toMatchObject({ location: '/app' });
		await expect(
			run(loginEvent({ search: '?redirectTo=%2Fadmin%2Fdashboard' }).event)
		).rejects.toMatchObject({ location: '/app' });
	});

	it('signs out a login that has no client profile', async () => {
		const { event, signOut } = loginEvent({ client: false });
		await expect(run(event)).resolves.toMatchObject({ status: 403 });
		expect(signOut).toHaveBeenCalledOnce();
	});

	it('skips the form for a client who is already signed in', async () => {
		await expect(
			loadPage(
				loginEvent({ user: { id: 'client-1' }, search: '?redirectTo=%2Fapp%2Fprogress' }).event
			)
		).rejects.toMatchObject({ status: 303, location: '/app/progress' });
	});

	it('shows the right notice after setting or resetting a password', async () => {
		expect(await loadPage(loginEvent({ search: '?password=set' }).event)).toEqual({
			notice: 'set'
		});
		expect(await loadPage(loginEvent({ search: '?password=updated' }).event)).toEqual({
			notice: 'updated'
		});
		expect(await loadPage(loginEvent({ search: '?password=other' }).event)).toEqual({
			notice: null
		});
	});
});

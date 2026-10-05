import { describe, expect, it, vi } from 'vitest';
import { GET, POST } from './+server';

describe('admin logout', () => {
	it('signs out same-origin requests and returns to login', async () => {
		const signOut = vi.fn().mockResolvedValue({ error: null });
		const event = {
			url: new URL('https://configains.fundrstudio.com/admin/logout'),
			request: new Request('https://configains.fundrstudio.com/admin/logout', {
				method: 'POST',
				headers: { origin: 'https://configains.fundrstudio.com' }
			}),
			locals: { localAdminDemo: false, supabase: { auth: { signOut } } }
		} as unknown as Parameters<typeof POST>[0];

		await expect(POST(event)).rejects.toMatchObject({ status: 303, location: '/admin/login' });
		expect(signOut).toHaveBeenCalledOnce();
	});

	it('routes a logged-out visit to login and an active visit to the dashboard', async () => {
		const loggedOut = {
			locals: { safeGetUser: vi.fn().mockResolvedValue({ user: null }) }
		} as unknown as Parameters<typeof GET>[0];
		const loggedIn = {
			locals: { safeGetUser: vi.fn().mockResolvedValue({ user: { id: 'admin' } }) }
		} as unknown as Parameters<typeof GET>[0];

		await expect(GET(loggedOut)).rejects.toMatchObject({ status: 303, location: '/admin/login' });
		await expect(GET(loggedIn)).rejects.toMatchObject({
			status: 303,
			location: '/admin/dashboard'
		});
	});
});

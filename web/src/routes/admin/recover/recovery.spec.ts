import { describe, expect, it, vi } from 'vitest';
import { actions, load } from './+page.server';

const code = 'a'.repeat(64);
const origin = 'https://configains.fundrstudio.com';

function recoveryEvent(role: 'admin' | 'client' | 'none' = 'admin') {
	const exchangeCodeForSession = vi.fn().mockResolvedValue({
		data: { user: { id: 'user-1' } },
		error: null
	});
	const verifyOtp = vi.fn();
	const signOut = vi.fn().mockResolvedValue({ error: null });
	const event = {
		url: new URL(`${origin}/admin/recover?code=${code}`),
		request: new Request(`${origin}/admin/recover`, {
			method: 'POST',
			headers: { origin, 'content-type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({ code })
		}),
		locals: {
			localAdminDemo: false,
			supabase: {
				auth: { exchangeCodeForSession, verifyOtp, signOut },
				// The recovered user is a row in one profile table at most.
				from: (table: string) => ({
					select: () => ({
						eq: () => ({
							maybeSingle: async () => ({
								data: table === `${role}_profiles` ? { id: 'user-1' } : null,
								error: null
							})
						})
					})
				})
			}
		}
	} as unknown as Parameters<typeof actions.default>[0];
	return { event, exchangeCodeForSession, verifyOtp, signOut };
}

describe('standard Supabase recovery links', () => {
	it('shows a confirmation without consuming the code on GET', async () => {
		const { event, exchangeCodeForSession } = recoveryEvent();
		const data = await load(event as Parameters<typeof load>[0]);
		expect(data).toMatchObject({ authCode: code, tokenHash: null });
		expect(exchangeCodeForSession).not.toHaveBeenCalled();
	});

	it('exchanges the code and sends an admin to the admin password form', async () => {
		const { event, exchangeCodeForSession, verifyOtp } = recoveryEvent();
		await expect(actions.default(event)).rejects.toMatchObject({
			status: 303,
			location: '/admin/reset-password'
		});
		expect(exchangeCodeForSession).toHaveBeenCalledExactlyOnceWith(code);
		expect(verifyOtp).not.toHaveBeenCalled();
	});

	it('sends a recovered client to their own reset screen', async () => {
		const { event, signOut } = recoveryEvent('client');
		await expect(actions.default(event)).rejects.toMatchObject({
			status: 303,
			location: '/account/reset-password'
		});
		expect(signOut).not.toHaveBeenCalled();
	});

	it('signs out a recovered user who is neither an admin nor a client', async () => {
		const { event, signOut } = recoveryEvent('none');
		const result = await actions.default(event);
		expect(result).toMatchObject({ status: 403 });
		expect(signOut).toHaveBeenCalledOnce();
	});
});

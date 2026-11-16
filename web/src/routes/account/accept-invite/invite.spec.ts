import { describe, expect, it, vi } from 'vitest';
import { actions, load } from './+page.server';

const token = 'b'.repeat(64);
const origin = 'https://configains.fundrstudio.com';
const password = 'a-long-enough-password';

type Options = {
	user?: { id: string } | null;
	/** Whether the signed-in or accepting user has a client profile. */
	client?: boolean;
	verifyError?: boolean;
	updateError?: boolean;
};

function inviteEvent({
	user = null,
	client = true,
	verifyError = false,
	updateError = false
}: Options) {
	const verifyOtp = vi
		.fn()
		.mockResolvedValue(
			verifyError
				? { data: { user: null }, error: { message: 'Token has expired or is invalid' } }
				: { data: { user: { id: 'client-1' } }, error: null }
		);
	const updateUser = vi.fn().mockResolvedValue({ error: updateError ? { message: 'weak' } : null });
	const signOut = vi.fn().mockResolvedValue({ error: null });
	const supabase = {
		auth: { verifyOtp, updateUser, signOut, exchangeCodeForSession: vi.fn() },
		from: (table: string) => {
			expect(table).toBe('client_profiles');
			return {
				select: () => ({
					eq: () => ({ maybeSingle: async () => ({ data: client ? { id: 'client-1' } : null }) })
				})
			};
		}
	};
	const event = {
		url: new URL(`${origin}/account/accept-invite?token_hash=${token}`),
		request: new Request(`${origin}/account/accept-invite`, {
			method: 'POST',
			headers: { origin, 'content-type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({ token_hash: token, password, confirmation: password })
		}),
		locals: { supabase, safeGetUser: async () => ({ user }) }
	};
	return { event, verifyOtp, updateUser, signOut };
}

const loadPage = (event: unknown) => load(event as Parameters<typeof load>[0]);
const submit = (event: unknown) => actions.default(event as Parameters<typeof actions.default>[0]);

describe('invitation page (GET)', () => {
	it('shows the password form to someone who is not signed in, without using the link', async () => {
		const { event, verifyOtp } = inviteEvent({});
		expect(await loadPage(event)).toEqual({ signedIn: false, tokenHash: token, authCode: null });
		expect(verifyOtp).not.toHaveBeenCalled();
	});

	it('recognises a client who is already signed in, and leaves the link unused', async () => {
		const { event, verifyOtp } = inviteEvent({ user: { id: 'client-1' } });
		expect(await loadPage(event)).toMatchObject({ signedIn: true });
		expect(verifyOtp).not.toHaveBeenCalled();
	});

	it('does not treat a signed-in non-client, such as the coach, as a client', async () => {
		const { event } = inviteEvent({ user: { id: 'coach-1' }, client: false });
		expect(await loadPage(event)).toMatchObject({ signedIn: false });
	});
});

describe('invitation page (set password)', () => {
	it('sets the password, signs out and sends the client to sign in', async () => {
		const { event, updateUser, signOut } = inviteEvent({});
		await expect(submit(event)).rejects.toMatchObject({
			status: 303,
			location: '/login?password=set'
		});
		expect(updateUser).toHaveBeenCalledExactlyOnceWith({ password });
		expect(signOut).toHaveBeenCalledOnce();
	});

	it('leads a client whose link was already used to sign in, instead of asking again', async () => {
		const { event, updateUser } = inviteEvent({ verifyError: true });
		expect(await submit(event)).toMatchObject({ status: 400, data: { linkUsed: true } });
		expect(updateUser).not.toHaveBeenCalled();
	});

	it('refuses an invitation that is not for a client account', async () => {
		const { event, updateUser, signOut } = inviteEvent({ client: false });
		expect(await submit(event)).toMatchObject({ status: 403 });
		expect(updateUser).not.toHaveBeenCalled();
		expect(signOut).toHaveBeenCalledOnce();
	});

	it('does not mark a password failure as a used link', async () => {
		const { event } = inviteEvent({ updateError: true });
		const result = (await submit(event)) as { status: number; data: { linkUsed: boolean } };
		expect(result.status).toBe(400);
		expect(result.data.linkUsed).toBe(false);
	});
});

import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { inviteClient, resendInvite, validInviteEmail } from './invites';
import { validNewPassword, validRecoveryToken } from './recovery';

type InviteReply = {
	data: { user: { id: string } | null };
	error: { message: string; code?: string } | null;
};

function admin(invite: InviteReply, deleteUser = vi.fn(async () => ({ error: null }))) {
	return {
		client: {
			auth: { admin: { inviteUserByEmail: vi.fn(async () => invite), deleteUser } }
		} as unknown as SupabaseClient,
		deleteUser
	};
}

function coach(profileError: { message: string } | null = null, existing = false) {
	const insert = vi.fn(async () => ({ error: profileError }));
	const maybeSingle = vi.fn(async () => ({ data: existing ? { id: 'user-1' } : null }));
	const select = vi.fn(() => ({ eq: () => ({ maybeSingle }) }));
	const client = { from: vi.fn(() => ({ insert, select })) } as unknown as SupabaseClient;
	return { client, insert };
}

const redirectTo = 'https://configains.fundrstudio.com/account/accept-invite';

describe('client invitation email', () => {
	it.each(['sam@example.com', 'first.last+tag@sub.example.co.uk'])('accepts %s', (email) => {
		expect(validInviteEmail(email)).toBe(true);
	});

	it.each([
		'',
		'no-at-sign',
		'two@@example.com',
		'space in@example.com',
		'a@b',
		42,
		`${'a'.repeat(250)}@x.co`
	])('rejects %s', (email) => {
		expect(validInviteEmail(email)).toBe(false);
	});
});

describe('inviteClient', () => {
	it('invites by email, then creates the profile through the coach session', async () => {
		const service = admin({ data: { user: { id: 'user-1' } }, error: null });
		const session = coach();

		const result = await inviteClient({
			admin: service.client,
			coach: session.client,
			email: 'sam@example.com',
			displayName: 'Sam',
			redirectTo
		});

		expect(result).toEqual({ ok: true, userId: 'user-1', resent: false });
		expect(service.client.auth.admin.inviteUserByEmail).toHaveBeenCalledWith('sam@example.com', {
			redirectTo
		});
		expect(session.insert).toHaveBeenCalledWith({ id: 'user-1', display_name: 'Sam' });
		expect(service.deleteUser).not.toHaveBeenCalled();
	});

	it('reports an address that already has an account', async () => {
		const service = admin({ data: { user: null }, error: { message: 'x', code: 'email_exists' } });
		const result = await inviteClient({
			admin: service.client,
			coach: coach().client,
			email: 'sam@example.com',
			displayName: null,
			redirectTo
		});
		expect(result).toEqual({ ok: false, message: 'That email already has a Configains account.' });
	});

	it('removes the new auth user when the profile write fails, so the invite can be retried', async () => {
		const service = admin({ data: { user: { id: 'user-2' } }, error: null });
		const result = await inviteClient({
			admin: service.client,
			coach: coach({ message: 'row-level security' }).client,
			email: 'sam@example.com',
			displayName: null,
			redirectTo
		});
		expect(result.ok).toBe(false);
		expect(service.deleteUser).toHaveBeenCalledWith('user-2');
	});
});

describe('inviting an address that was invited before', () => {
	it('keeps the existing profile and auth user when Supabase re-sends the invite', async () => {
		const service = admin({ data: { user: { id: 'user-1' } }, error: null });
		const session = coach(null, true);
		const result = await inviteClient({
			admin: service.client,
			coach: session.client,
			email: 'sam@example.com',
			displayName: 'Sam',
			redirectTo
		});
		expect(result).toEqual({ ok: true, userId: 'user-1', resent: true });
		expect(session.insert).not.toHaveBeenCalled();
		expect(service.deleteUser).not.toHaveBeenCalled();
	});
});

describe('resendInvite', () => {
	function service(user: { email: string; email_confirmed_at: string | null } | null) {
		const inviteUserByEmail = vi.fn(async () => ({ data: { user: {} }, error: null }));
		const client = {
			auth: {
				admin: {
					getUserById: vi.fn(async () => ({
						data: { user },
						error: user ? null : { message: 'x' }
					})),
					inviteUserByEmail
				}
			}
		} as unknown as SupabaseClient;
		return { client, inviteUserByEmail };
	}

	it('sends a new link to a client who has not accepted', async () => {
		const { client, inviteUserByEmail } = service({
			email: 'sam@example.com',
			email_confirmed_at: null
		});
		expect(await resendInvite(client, 'user-1', redirectTo)).toEqual({
			ok: true,
			email: 'sam@example.com'
		});
		expect(inviteUserByEmail).toHaveBeenCalledWith('sam@example.com', { redirectTo });
	});

	it('does not resend once the client has accepted', async () => {
		const { client, inviteUserByEmail } = service({
			email: 'sam@example.com',
			email_confirmed_at: '2026-11-01T00:00:00Z'
		});
		const result = await resendInvite(client, 'user-1', redirectTo);
		expect(result.ok).toBe(false);
		expect(inviteUserByEmail).not.toHaveBeenCalled();
	});

	it('reports a missing account', async () => {
		const { client } = service(null);
		expect((await resendInvite(client, 'user-1', redirectTo)).ok).toBe(false);
	});
});

describe('invitation and password tokens', () => {
	it('accepts a 64-character token hash and rejects malformed tokens', () => {
		expect(validRecoveryToken('a'.repeat(64))).toBe(true);
		expect(validRecoveryToken('short')).toBe(false);
		expect(validRecoveryToken('bad token with spaces and more than thirty two chars')).toBe(false);
	});

	it('applies the admin password rules to new client passwords', () => {
		expect(validNewPassword('correct horse battery', 'correct horse battery')).toBeNull();
		expect(validNewPassword('short', 'short')).toMatch(/12 and 128/);
		expect(validNewPassword('correct horse battery', 'different horse battery')).toBe(
			'The passwords do not match.'
		);
	});
});

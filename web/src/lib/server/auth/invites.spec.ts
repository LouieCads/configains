import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { inviteClient, validInviteEmail } from './invites';
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

function coach(profileError: { message: string } | null = null) {
	const insert = vi.fn(async () => ({ error: profileError }));
	const client = { from: vi.fn(() => ({ insert })) } as unknown as SupabaseClient;
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

		expect(result).toEqual({ ok: true, userId: 'user-1' });
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

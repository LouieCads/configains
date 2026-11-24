import { describe, expect, it } from 'vitest';
import { emailExample, isCommonPassword, passwordChecks, passwordExample } from './password';

describe('isCommonPassword', () => {
	it('flags well known passwords and small variations of them', () => {
		for (const value of [
			'password',
			'Password@123',
			'P@ssw0rd2024',
			'qwerty!!',
			'Configains1',
			'111111111111',
			'1234567890123'
		])
			expect(isCommonPassword(value), value).toBe(true);
	});

	it('does not flag a long passphrase or random text', () => {
		for (const value of [
			'correct horse battery staple',
			'Tr4in-Hard-Sunr1se-Lift',
			'k7#Vq2!mZx9Lp'
		])
			expect(isCommonPassword(value), value).toBe(false);
	});

	it('does not flag an empty value', () => {
		expect(isCommonPassword('')).toBe(false);
	});
});

describe('passwordChecks', () => {
	const states = (password: string, confirmation = '') =>
		Object.fromEntries(passwordChecks(password, confirmation).map((c) => [c.id, c.state]));

	it('starts idle', () => {
		expect(states('')).toEqual({ length: 'idle', common: 'idle', match: 'idle' });
	});

	it('marks a short password bad and waits to judge it as common', () => {
		expect(states('abc')).toEqual({ length: 'bad', common: 'idle', match: 'idle' });
	});

	it('warns on a long but common password', () => {
		expect(states('Password@123')).toMatchObject({ length: 'ok', common: 'warn' });
	});

	it('passes a strong password that matches its confirmation', () => {
		expect(states('k7#Vq2!mZx9Lp', 'k7#Vq2!mZx9Lp')).toEqual({
			length: 'ok',
			common: 'ok',
			match: 'ok'
		});
	});

	it('marks a mismatch bad', () => {
		expect(states('k7#Vq2!mZx9Lp', 'k7#Vq2')).toMatchObject({ match: 'bad' });
	});
});

describe('placeholder examples', () => {
	it('shows a password that passes every hint, and a well formed email', () => {
		expect(passwordChecks(passwordExample, passwordExample).every((c) => c.state === 'ok')).toBe(
			true
		);
		expect(emailExample).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
	});
});

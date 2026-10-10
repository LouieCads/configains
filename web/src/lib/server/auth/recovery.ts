export function validRecoveryToken(token: unknown): token is string {
	return typeof token === 'string' && /^[A-Za-z0-9_-]{32,512}$/.test(token);
}

/** Same rules the admin reset screen applies: 12–128 characters, confirmed twice. */
export function validNewPassword(password: string, confirmation: string) {
	if (password.length < 12 || password.length > 128 || !password.trim())
		return 'Use a password between 12 and 128 characters.';
	if (password !== confirmation) return 'The passwords do not match.';
	return null;
}

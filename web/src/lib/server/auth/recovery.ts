export function validRecoveryToken(token: unknown): token is string {
	return typeof token === 'string' && /^[A-Za-z0-9_-]{32,512}$/.test(token);
}

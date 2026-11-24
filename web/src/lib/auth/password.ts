// Password hints shown while a client types. They guide only: the server rules in
// `$lib/server/auth/recovery.ts` (12 to 128 characters, confirmed twice) stay the gate.

export const minPasswordLength = 12;
export const maxPasswordLength = 128;
/** Example values shown as placeholders. */
export const emailExample = 'youremail@gmail.com';
// Passes every hint: 12+ characters and not a common password. Unrelated words, like a passphrase.
export const passwordExample = 'Blue-Lamp-River-47';

// Whole words that make a password easy to guess, even with digits or symbols around them.
const commonWords = [
	'password',
	'passw0rd',
	'qwerty',
	'qwertyuiop',
	'asdfgh',
	'asdfghjkl',
	'zxcvbn',
	'welcome',
	'letmein',
	'admin',
	'administrator',
	'login',
	'iloveyou',
	'football',
	'baseball',
	'monkey',
	'dragon',
	'master',
	'sunshine',
	'princess',
	'superman',
	'batman',
	'trustno',
	'changeme',
	'abc',
	'abcdef',
	'abcdefgh',
	'secret',
	'configains',
	'fitness'
];

// Look-alike characters people swap in ("p@ssw0rd"), mapped back to letters before checking.
const lookAlikes: Record<string, string> = {
	'@': 'a',
	'4': 'a',
	'3': 'e',
	'1': 'i',
	'!': 'i',
	'0': 'o',
	$: 's',
	'5': 's',
	'7': 't'
};

function isRepeatedOrCounting(value: string) {
	if (/^(.)\1+$/.test(value)) return true;
	return '01234567890123456789'.includes(value) || '98765432109876543210'.includes(value);
}

/**
 * True when the password is a well known one, or a small change to one:
 * "password", "Password@123", "P@ssw0rd2024", "qwerty!!", "111111111111".
 * A long passphrase that merely contains a common word is not flagged.
 */
export function isCommonPassword(password: string): boolean {
	const lower = password.toLowerCase();
	if (!lower) return false;
	if (!/[a-z]/.test(lower)) return isRepeatedOrCounting(lower.replace(/[^0-9]/g, '') || lower);
	// Trailing digits and symbols ("@123", "2024!!") are padding, so drop them before undoing look-alikes.
	const core = lower.replace(/[^a-z]+$/, '');
	const letters = [...core]
		.map((char) => lookAlikes[char] ?? char)
		.join('')
		.replace(/[^a-z]/g, '');
	if (!letters) return false;
	return commonWords.some((word) => letters.startsWith(word) && letters.length <= word.length + 2);
}

export type PasswordCheck = {
	id: 'length' | 'common' | 'match';
	label: string;
	/** "idle" until the person has typed something that can be judged. */
	state: 'idle' | 'ok' | 'bad' | 'warn';
};

/** Live status of each hint for the current values. */
export function passwordChecks(password: string, confirmation: string): PasswordCheck[] {
	const typed = password.length > 0;
	const lengthOk = password.length >= minPasswordLength;
	return [
		{
			id: 'length',
			label: `At least ${minPasswordLength} characters`,
			state: !typed ? 'idle' : lengthOk ? 'ok' : 'bad'
		},
		{
			id: 'common',
			label: 'Not a common password',
			state: !typed || !lengthOk ? 'idle' : isCommonPassword(password) ? 'warn' : 'ok'
		},
		{
			id: 'match',
			label: 'Both passwords match',
			state: !confirmation ? 'idle' : confirmation === password ? 'ok' : 'bad'
		}
	];
}

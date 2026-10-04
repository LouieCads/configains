import { describe, expect, it } from 'vitest';
import { allowLocalDemo } from './local-demo-policy';

describe('temporary local admin access', () => {
	it('requires opt-in, development mode, and a loopback host and client', () => {
		expect(allowLocalDemo(true, 'true', 'localhost', '::1')).toBe(true);
		expect(allowLocalDemo(true, 'true', '127.0.0.1', '::ffff:127.0.0.1')).toBe(true);
		expect(allowLocalDemo(true, undefined, 'localhost', '127.0.0.1')).toBe(false);
		expect(allowLocalDemo(true, 'false', 'localhost', '127.0.0.1')).toBe(false);
		expect(allowLocalDemo(false, 'true', 'localhost', '127.0.0.1')).toBe(false);
		expect(allowLocalDemo(true, 'true', 'www.cashfuerte.fundrstudio.com', '127.0.0.1')).toBe(false);
		expect(allowLocalDemo(true, 'true', 'localhost', '192.168.1.10')).toBe(false);
	});
});

/** True for localhost/loopback hosts and addresses, including IPv4-mapped IPv6. */
export function isLoopback(address: string) {
	const normalized = address
		.toLowerCase()
		.replace(/^\[|\]$/g, '')
		.replace(/^::ffff:/, '');
	return ['localhost', '::1', '127.0.0.1'].includes(normalized);
}
/**
 * The credential-free local CMS demo runs only in Vite dev, when explicitly
 * enabled, and when both the URL host and the client are loopback.
 */
export function allowLocalDemo(
	development: boolean,
	enabled: string | undefined,
	hostname: string,
	clientAddress: string
) {
	return development && enabled === 'true' && isLoopback(hostname) && isLoopback(clientAddress);
}

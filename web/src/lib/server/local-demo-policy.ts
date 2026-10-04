export function isLoopback(address: string) {
	const normalized = address
		.toLowerCase()
		.replace(/^\[|\]$/g, '')
		.replace(/^::ffff:/, '');
	return ['localhost', '::1', '127.0.0.1'].includes(normalized);
}
export function allowLocalDemo(
	development: boolean,
	enabled: string | undefined,
	hostname: string,
	clientAddress: string
) {
	return development && enabled === 'true' && isLoopback(hostname) && isLoopback(clientAddress);
}

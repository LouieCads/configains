/**
 * Calls a CMS endpoint and returns its JSON body.
 *
 * Throws an `Error` carrying the server's `message`, or `fallback` when the
 * response has none (for example an HTML error page from the host). Callers
 * show `error.message` to the admin.
 */
export async function cmsRequest<T = Record<string, unknown>>(
	url: string,
	init: RequestInit & { json?: unknown },
	fallback: string
): Promise<T> {
	const { json, ...options } = init;
	if (json !== undefined) {
		options.headers = { 'Content-Type': 'application/json', ...options.headers };
		options.body = JSON.stringify(json);
	}
	const response = await fetch(url, options);
	const body = response.status === 204 ? null : await response.json().catch(() => null);
	if (!response.ok) throw new Error(body?.message || fallback);
	return body as T;
}

/** Readable message from an unknown thrown value. */
export function errorMessage(error: unknown, fallback: string): string {
	return error instanceof Error ? error.message : fallback;
}

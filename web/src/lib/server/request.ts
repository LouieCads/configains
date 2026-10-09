import { error } from '@sveltejs/kit';

/**
 * Parses a JSON request body that must be a plain object.
 * Responds with 400 and `message` for malformed or non-object bodies.
 */
export async function readJsonObject(
	request: Request,
	message = 'Invalid content request.'
): Promise<Record<string, unknown>> {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, message);
	}
	if (!body || typeof body !== 'object' || Array.isArray(body)) error(400, message);
	return body as Record<string, unknown>;
}

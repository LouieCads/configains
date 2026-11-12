/**
 * Starts an exercise demo upload. Clips can be larger than a Netlify function accepts, so the
 * browser uploads the file straight to Supabase Storage with the signed URL returned here.
 * Each upload gets a random name under the admin's user id and is never overwritten.
 */
import { json } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth/admin';
import { requireSameOrigin } from '$lib/server/auth/origin';
import { DEMO_BUCKET, DEMO_MIME_TYPES, DEMO_SIZE_LABEL, MAX_DEMO_BYTES } from '$lib/coaching/demo';

export const POST = async (event) => {
	requireSameOrigin(event);
	const { user } = await requireAdmin(event);
	if (event.locals.localAdminDemo)
		return json({ message: 'Demo uploads are not available in the local demo.' }, { status: 400 });

	const body = (await event.request.json().catch(() => null)) as {
		type?: unknown;
		size?: unknown;
	} | null;
	const type = typeof body?.type === 'string' ? DEMO_MIME_TYPES[body.type] : undefined;
	const size = typeof body?.size === 'number' ? body.size : 0;
	if (!type || size <= 0 || size > MAX_DEMO_BYTES)
		return json(
			{ message: `Upload a GIF, WebP, MP4 or WebM file no larger than ${DEMO_SIZE_LABEL}.` },
			{ status: 400 }
		);

	const path = `${user.id}/${crypto.randomUUID()}.${type.extension}`;
	const { data, error } = await event.locals.supabase.storage
		.from(DEMO_BUCKET)
		.createSignedUploadUrl(path);
	if (error || !data)
		return json({ message: 'The upload could not be started. Try again.' }, { status: 400 });
	return json({ path, signedUrl: data.signedUrl }, { status: 201 });
};

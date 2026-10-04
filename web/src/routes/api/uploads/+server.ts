import { requireAdmin } from '$lib/server/auth/admin';
import { json } from '@sveltejs/kit';
import { requireSameOrigin } from '$lib/server/auth/origin';
import { MAX_IMAGE_BYTES, IMAGE_SIZE_LABEL, IMAGE_MIME_TYPES } from '$lib/content/uploads';

const buckets = ['site', 'testimonials', 'transformations'] as const;

export const POST = async (event) => {
	requireSameOrigin(event);
	const { user } = await requireAdmin(event);
	const form = await event.request.formData();
	const file = form.get('file');
	const bucket = String(form.get('bucket') ?? 'site');
	if (!(file instanceof File) || !buckets.includes(bucket as (typeof buckets)[number]))
		return json({ message: 'A file and valid bucket are required.' }, { status: 400 });
	if (!IMAGE_MIME_TYPES.includes(file.type) || !file.size || file.size > MAX_IMAGE_BYTES)
		return json(
			{ message: `Upload an image no larger than ${IMAGE_SIZE_LABEL}.` },
			{ status: 400 }
		);

	const extension =
		file.name
			.split('.')
			.pop()
			?.replace(/[^a-z0-9]/gi, '')
			.toLowerCase() || 'bin';
	const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
	const { error: uploadError } = await event.locals.supabase.storage
		.from(bucket)
		.upload(path, file, { contentType: file.type, upsert: false });
	if (uploadError) return json({ message: uploadError.message }, { status: 400 });
	const { data } = event.locals.supabase.storage.from(bucket).getPublicUrl(path);
	return json({ path, url: data.publicUrl }, { status: 201 });
};

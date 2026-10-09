/** Upload limits and destinations shared by the editor and the upload endpoint. */

// Leave room for multipart overhead within Netlify's binary request limit.
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const IMAGE_SIZE_LABEL = '4 MB';
// The source stays in the browser; only the cropped result reaches the upload endpoint.
export const MAX_SOURCE_IMAGE_BYTES = 20 * 1024 * 1024;
export const SOURCE_IMAGE_SIZE_LABEL = '20 MB';
export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** Supabase Storage buckets the CMS may write to (see the initial migration). */
export const UPLOAD_BUCKETS = ['site', 'testimonials', 'transformations'] as const;
export type UploadBucket = (typeof UPLOAD_BUCKETS)[number];

export function isUploadBucket(value: string): value is UploadBucket {
	return (UPLOAD_BUCKETS as readonly string[]).includes(value);
}

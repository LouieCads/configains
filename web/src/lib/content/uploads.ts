// Leave room for multipart overhead within Netlify's binary request limit.
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const IMAGE_SIZE_LABEL = '4 MB';
export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

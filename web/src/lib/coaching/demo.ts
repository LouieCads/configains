import { PUBLIC_SUPABASE_URL } from '$env/static/public';

/** Bucket for exercise demonstration clips (see the program detail migration). */
export const DEMO_BUCKET = 'exercise-media';
export const MAX_DEMO_BYTES = 25 * 1024 * 1024;
export const DEMO_SIZE_LABEL = '25 MB';
export const DEMO_MIME_TYPES: Record<string, { kind: 'image' | 'video'; extension: string }> = {
	'image/gif': { kind: 'image', extension: 'gif' },
	'image/webp': { kind: 'image', extension: 'webp' },
	'video/mp4': { kind: 'video', extension: 'mp4' },
	'video/webm': { kind: 'video', extension: 'webm' }
};

/** What the client sees for one exercise. Null when the exercise has no demonstration. */
export type ExerciseDemo = {
	youtubeId: string | null;
	mediaUrl: string | null;
	mediaKind: 'image' | 'video' | null;
};

const youtubeId = /^[A-Za-z0-9_-]{11}$/;
const youtubeHosts = new Set([
	'youtube.com',
	'www.youtube.com',
	'm.youtube.com',
	'music.youtube.com',
	'youtube-nocookie.com',
	'www.youtube-nocookie.com'
]);

/**
 * Reads the video id from a YouTube link: watch, share (youtu.be), Shorts, embed or live links.
 * A bare 11-character id is accepted too. Returns null for anything else.
 */
export function parseYoutubeId(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const input = value.trim();
	if (youtubeId.test(input)) return input;
	let url: URL;
	try {
		url = new URL(input);
	} catch {
		return null;
	}
	if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
	let id: string | null = null;
	if (url.hostname === 'youtu.be') id = url.pathname.split('/')[1] ?? null;
	else if (youtubeHosts.has(url.hostname)) {
		const [first, second] = url.pathname.split('/').filter(Boolean);
		if (first === 'watch') id = url.searchParams.get('v');
		else if (first && ['shorts', 'embed', 'live', 'v'].includes(first)) id = second ?? null;
	}
	return id && youtubeId.test(id) ? id : null;
}

/** Storage paths are `<uploader uuid>/<random uuid>.<extension>`, as made by the upload action. */
const mediaPathPattern =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(gif|webp|mp4|webm)$/;

export function validMediaPath(value: unknown): value is string {
	return typeof value === 'string' && mediaPathPattern.test(value);
}

export function mediaKindOf(path: string): 'image' | 'video' {
	return /\.(mp4|webm)$/.test(path) ? 'video' : 'image';
}

export function demoMediaUrl(path: string): string {
	return `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/${DEMO_BUCKET}/${path}`;
}

/** Privacy-enhanced player: YouTube sets no tracking cookies until the video plays. */
export function youtubeEmbedUrl(id: string, autoplay = false): string {
	const params = new URLSearchParams({ rel: '0', modestbranding: '1', playsinline: '1' });
	if (autoplay) params.set('autoplay', '1');
	return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}

export function youtubeThumbnail(id: string): string {
	return `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
}

export function demoFrom(
	row:
		| { youtube_id: string | null; media_path: string | null; media_kind: string | null }
		| null
		| undefined
): ExerciseDemo | null {
	if (!row) return null;
	const mediaUrl =
		row.media_path && validMediaPath(row.media_path) ? demoMediaUrl(row.media_path) : null;
	const id = row.youtube_id && youtubeId.test(row.youtube_id) ? row.youtube_id : null;
	if (!mediaUrl && !id) return null;
	return {
		youtubeId: id,
		mediaUrl,
		mediaKind: mediaUrl ? (row.media_kind === 'video' ? 'video' : 'image') : null
	};
}

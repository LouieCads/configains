import { describe, expect, it } from 'vitest';
import { demoFrom, parseYoutubeId, validMediaPath, youtubeEmbedUrl } from './demo';

describe('parseYoutubeId', () => {
	it.each([
		['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
		['https://youtu.be/dQw4w9WgXcQ?t=10', 'dQw4w9WgXcQ'],
		['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
		['https://m.youtube.com/watch?v=dQw4w9WgXcQ&feature=share', 'dQw4w9WgXcQ'],
		['https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
		['dQw4w9WgXcQ', 'dQw4w9WgXcQ']
	])('reads %s', (input, id) => {
		expect(parseYoutubeId(input)).toBe(id);
	});

	it.each([
		'',
		'https://vimeo.com/123',
		'https://evil.example/watch?v=dQw4w9WgXcQ',
		'javascript:alert(1)',
		'https://www.youtube.com/watch?v=short',
		42
	])('rejects %s', (input) => {
		expect(parseYoutubeId(input)).toBeNull();
	});
});

describe('demo media', () => {
	const path = '11111111-2222-3333-4444-555555555555/66666666-7777-8888-9999-000000000000.mp4';

	it('accepts only paths made by the upload action', () => {
		expect(validMediaPath(path)).toBe(true);
		expect(validMediaPath('../secret.mp4')).toBe(false);
		expect(validMediaPath(path.replace('.mp4', '.exe'))).toBe(false);
	});

	it('builds the client view and ignores rows without a demo', () => {
		expect(demoFrom(null)).toBeNull();
		expect(demoFrom({ youtube_id: null, media_path: null, media_kind: null })).toBeNull();
		const demo = demoFrom({ youtube_id: 'dQw4w9WgXcQ', media_path: path, media_kind: 'video' });
		expect(demo).toMatchObject({ youtubeId: 'dQw4w9WgXcQ', mediaKind: 'video' });
		expect(demo?.mediaUrl).toMatch(/\/storage\/v1\/object\/public\/exercise-media\//);
	});

	it('embeds through the privacy-enhanced player', () => {
		expect(youtubeEmbedUrl('dQw4w9WgXcQ')).toMatch(
			/^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?/
		);
	});
});

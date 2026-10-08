export type ImageGuide = { width: number; height: number; note?: string };

export function imageGuide(path: string): ImageGuide {
	if (path.endsWith('before_image_url') || path.endsWith('after_image_url'))
		return { width: 800, height: 800, note: 'Both photos use the same square frame.' };
	if (path.endsWith('image_url')) return { width: 512, height: 512, note: 'Shown as a circle.' };
	if (path.endsWith('portrait')) return { width: 960, height: 664 };
	if (path.endsWith('favicon')) return { width: 512, height: 512 };
	if (path.endsWith('logo'))
		return { width: 840, height: 192, note: 'Keep the logo away from the edges.' };
	if (path.endsWith('socialImage') || path.endsWith('seo-image'))
		return { width: 1200, height: 630, note: 'Social sharing preview.' };
	if (path.endsWith('hero-image')) return { width: 1200, height: 800 };
	if (path.endsWith('previewImage')) return { width: 1000, height: 720 };
	if (path.endsWith('image')) return { width: 800, height: 800 };
	return { width: 800, height: 800 };
}

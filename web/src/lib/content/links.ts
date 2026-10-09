/** Keeps admins in draft preview by adding `preview=1` to same-site links. */
export function publicHref(href: string, preview = false) {
	if (!preview || !href.startsWith('/')) return href;
	const [path, hash] = href.split('#');
	return `${path}${path.includes('?') ? '&' : '?'}preview=1${hash ? `#${hash}` : ''}`;
}

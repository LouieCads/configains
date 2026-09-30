/** Reveal once, preserving readable content without JavaScript or when motion is reduced. */
export function reveal(node: HTMLElement, delay = 0) {
	const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
	let animation: Animation | undefined;
	if (preference.matches || typeof IntersectionObserver === 'undefined') return;
	const observer = new IntersectionObserver(
		([entry]) => {
			if (!entry.isIntersecting) return;
			observer.disconnect();
			animation = node.animate(
				[
					{ opacity: 0, transform: 'translateY(22px)' },
					{ opacity: 1, transform: 'translateY(0)' }
				],
				{ duration: 700, delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }
			);
		},
		{ threshold: 0.08 }
	);
	observer.observe(node);
	function stop() {
		animation?.cancel();
		observer.disconnect();
	}
	preference.addEventListener('change', stop);
	return {
		destroy() {
			stop();
			preference.removeEventListener('change', stop);
		}
	};
}

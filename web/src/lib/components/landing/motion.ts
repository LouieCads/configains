/**
 * Reveal once, preserving readable content without JavaScript or when motion is reduced.
 * Highlighter swipes (`[data-mark]`) inside the node draw in just after it appears.
 */
export function reveal(node: HTMLElement, delay = 0) {
	const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
	let animations: Animation[] = [];
	if (preference.matches || typeof IntersectionObserver === 'undefined') return;
	const observer = new IntersectionObserver(
		([entry]) => {
			if (!entry.isIntersecting) return;
			observer.disconnect();
			animations.push(
				node.animate(
					[
						{ opacity: 0, transform: 'translateY(22px)' },
						{ opacity: 1, transform: 'translateY(0)' }
					],
					{ duration: 700, delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }
				)
			);
			for (const swipe of node.querySelectorAll<HTMLElement>('[data-mark]'))
				animations.push(
					swipe.animate([{ backgroundSize: '0% 100%' }, { backgroundSize: '100% 100%' }], {
						duration: 800,
						delay: delay + 350,
						easing: 'cubic-bezier(.65,0,.35,1)',
						fill: 'backwards'
					})
				);
		},
		{ threshold: 0.08 }
	);
	observer.observe(node);
	function stop() {
		for (const animation of animations) animation.cancel();
		animations = [];
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

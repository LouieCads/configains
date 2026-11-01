/**
 * 3D tilt that follows a mouse or pen over the node and eases back on leave.
 * Touch and reduced motion get no tilt. `max` is the largest rotation in degrees.
 */
export function tilt(node: HTMLElement, max = 9) {
	const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
	const rest = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
	let frame = 0;
	function move(event: PointerEvent) {
		if (event.pointerType === 'touch' || preference.matches) return;
		const { clientX, clientY } = event;
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(() => {
			const box = node.getBoundingClientRect();
			const x = (clientX - box.left) / box.width - 0.5;
			const y = (clientY - box.top) / box.height - 0.5;
			node.style.transition = 'transform 0.12s ease-out';
			node.style.transform = `perspective(900px) rotateX(${(-y * max * 2).toFixed(2)}deg) rotateY(${(x * max * 2).toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
		});
	}
	function leave() {
		cancelAnimationFrame(frame);
		node.style.transition = 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)';
		node.style.transform = rest;
	}
	node.style.willChange = 'transform';
	node.addEventListener('pointermove', move);
	node.addEventListener('pointerleave', leave);
	return {
		destroy() {
			cancelAnimationFrame(frame);
			node.removeEventListener('pointermove', move);
			node.removeEventListener('pointerleave', leave);
		}
	};
}

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

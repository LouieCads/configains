<script lang="ts">
	import { onMount } from 'svelte';
	let host: HTMLDivElement;
	let ready = $state(false);
	let reduced = $state(false);
	let scene: { syncMotion: () => void; destroy: () => void } | undefined;
	onMount(() => {
		let disposed = false;
		const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
		function updatePreference() {
			reduced = preference.matches;
			scene?.syncMotion();
		}
		updatePreference();
		preference.addEventListener('change', updatePreference);
		void import('./fitness-scene').then(({ createFitnessScene }) => {
			if (disposed) return;
			try {
				scene = createFitnessScene(host, () => !reduced);
				ready = true;
			} catch {
				/* The static illustration remains available without WebGL. */
			}
		});
		return () => {
			disposed = true;
			preference.removeEventListener('change', updatePreference);
			scene?.destroy();
		};
	});
</script>

<div class="fitness-object" class:ready>
	<div class="scene-host" bind:this={host} aria-hidden="true"></div>
	<svg class="scene-fallback" viewBox="0 0 550 500" aria-hidden="true">
		<defs>
			<linearGradient id="fitness-metal" x1="0" y1="0" x2="1" y2="1"
				><stop stop-color="#fff" /><stop offset="1" stop-color="#aabcbf" /></linearGradient
			>
			<linearGradient id="fitness-cyan" x1="0" y1="0" x2="1" y2="1"
				><stop stop-color="#9cf2f5" /><stop offset=".5" stop-color="#55d5e5" /><stop
					offset="1"
					stop-color="#1798b1"
				/></linearGradient
			>
		</defs>
		<g transform="translate(-38 -62) scale(1.25)">
			<ellipse cx="260" cy="425" rx="135" ry="15" fill="#1a2f32" opacity=".07" />
			<ellipse
				cx="220"
				cy="328"
				rx="104"
				ry="84"
				fill="none"
				stroke="url(#fitness-metal)"
				stroke-width="49"
				transform="rotate(-20 220 328)"
			/>
			<g transform="rotate(-28 280 205)">
				<rect x="145" y="185" width="255" height="36" rx="18" fill="url(#fitness-metal)" />
				<path d="M135 135 182 155 182 250 135 272 90 248 90 158Z" fill="url(#fitness-cyan)" />
				<path d="M405 135 452 155 452 250 405 272 360 248 360 158Z" fill="url(#fitness-cyan)" />
				<circle cx="418" cy="203" r="21" fill="#253740" /><circle
					cx="418"
					cy="203"
					r="15"
					fill="none"
					stroke="#b8ecf0"
				/>
			</g>
		</g>
	</svg>
</div>

<style>
	.fitness-object {
		width: 100%;
		height: 100%;
		position: absolute;
		inset: 0;
	}
	.scene-host,
	.scene-fallback {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}
	.scene-host {
		opacity: 0;
		transition: opacity 0.5s ease;
	}
	.ready .scene-host {
		opacity: 1;
	}
	.ready .scene-fallback {
		display: none;
	}
	.scene-host :global(canvas) {
		display: block;
		width: 100%;
		height: 100%;
	}

	@media (prefers-reduced-motion: reduce) {
		.scene-host {
			transition: none;
		}
	}
</style>

<script lang="ts">
	import Info from '@lucide/svelte/icons/info';

	/** Short note that appears on hover, keyboard focus or tap, instead of sitting in the page. */
	let { text, label = 'More information' }: { text: string; label?: string } = $props();
	const id = $props.id();
</script>

<span class="tip">
	<button type="button" class="trigger" aria-label={label} aria-describedby={id}>
		<Info size={16} aria-hidden="true" />
	</button>
	<span role="tooltip" {id} class="bubble">{text}</span>
</span>

<style>
	.tip {
		position: relative;
		display: inline-flex;
		vertical-align: middle;
	}
	.trigger {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		padding: 0;
		border: 0;
		border-radius: 999px;
		background: transparent;
		color: var(--color-muted, #5b6f72);
		cursor: help;
	}
	.trigger:hover,
	.trigger:focus-visible {
		color: var(--color-ink, #17292d);
	}
	.bubble {
		position: absolute;
		z-index: 20;
		bottom: calc(100% + 0.4rem);
		left: 0;
		width: min(18rem, calc(100vw - 3rem));
		padding: 0.6rem 0.8rem;
		border-radius: 8px;
		background: var(--color-ink, #17292d);
		color: #fff;
		font-family: Arial, sans-serif;
		font-size: 0.8rem;
		font-weight: 400;
		line-height: 1.45;
		text-align: left;
		visibility: hidden;
		opacity: 0;
		pointer-events: none;
		transition: opacity 120ms ease;
	}
	.tip:hover .bubble,
	.tip:focus-within .bubble {
		visibility: visible;
		opacity: 1;
	}
</style>

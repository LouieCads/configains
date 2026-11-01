<script lang="ts">
	import { buttonArrow } from './styles';
	let { size = 20 }: { size?: number } = $props();
</script>

<svg
	class={buttonArrow}
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	aria-hidden="true"
	><path
		d="M4 12h15m-6-6 6 6-6 6"
		stroke="currentColor"
		stroke-width="1.8"
		stroke-linecap="square"
		stroke-linejoin="miter"
	/></svg
>

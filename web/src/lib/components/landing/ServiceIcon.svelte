<script lang="ts">
	let { name, size = 22 }: { name: string; size?: number } = $props();
</script>

<svg
	class="[stroke:currentColor] [stroke-width:1.5] [stroke-linecap:round] [stroke-linejoin:round]"
	width={size}
	height={size}
	viewBox="0 0 32 32"
	fill="none"
	aria-hidden="true"
>
	{#if name === 'training'}<path d="m7 21 14-14M4 18l10 10M18 4l10 10M3 23l6 6M23 3l6 6" />
	{:else if name === 'nutrition'}<path
			d="M17 10c-2-8 5-8 8-7-1 6-5 8-8 7ZM16 12c-5-4-12-1-12 6 0 5 4 11 9 10l3-1 3 1c5 1 9-5 9-10 0-7-7-10-12-6ZM16 12c0-4-2-6-4-7"
		/>
	{:else}<path d="M5 6h22v16H16l-7 5v-5H5V6ZM10 12h12M10 17h7" />{/if}
</svg>

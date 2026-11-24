<script lang="ts" module>
	export type Tile = {
		label: string;
		value: string;
		unit?: string;
		change?: { text: string; direction: 'up' | 'down' | 'flat' } | null;
		changeLabel?: string;
		tone?: 'neutral' | 'good';
	};
</script>

<script lang="ts">
	// A set of figures laid out as even rows, so no row ends with an empty cell: every tile in a row
	// shares the width, and a short last row stretches across instead of leaving a gap. The grid has
	// twelve columns because 12 divides evenly by 1, 2, 3 and 4 tiles per row.
	import StatTile from './StatTile.svelte';

	let { tiles, perRow = 3 }: { tiles: Tile[]; perRow?: 2 | 3 | 4 } = $props();

	/** Tiles per row, as even as possible: 4 becomes 2 + 2, 5 becomes 3 + 2, 7 becomes 3 + 2 + 2. */
	function rowSizes(total: number, most: number) {
		const rows = Math.ceil(total / most);
		const base = Math.floor(total / rows);
		const extra = total % rows;
		return Array.from({ length: rows }, (_, index) => base + (index < extra ? 1 : 0));
	}

	// Literal class names so Tailwind can see them.
	const spans: Record<number, string> = {
		1: 'min-[560px]:col-span-12',
		2: 'min-[560px]:col-span-6',
		3: 'min-[560px]:col-span-4',
		4: 'min-[560px]:col-span-3'
	};

	const placed = $derived(
		rowSizes(tiles.length, perRow)
			.flatMap((size) => Array.from({ length: size }, () => size))
			.map((size, index) => ({
				tile: tiles[index],
				// On a narrow screen there are two columns, and an odd last tile takes the full row.
				span: `${index === tiles.length - 1 && tiles.length % 2 === 1 ? 'col-span-2' : 'col-span-1'} ${spans[size]}`
			}))
	);
</script>

{#if tiles.length > 0}
	<div class="grid grid-cols-2 gap-3 min-[560px]:grid-cols-12">
		{#each placed as { tile, span } (tile.label)}
			<div class="grid {span}">
				<StatTile {...tile} />
			</div>
		{/each}
	</div>
{/if}

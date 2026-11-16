<script lang="ts">
	// A titled card around one chart. Every chart has a table twin under "View as table", so the figures
	// never depend on hover, colour or sight.
	import type { Snippet } from 'svelte';
	import { card, help } from '$lib/features/cms/styles';

	let {
		title,
		description = '',
		columns,
		rows,
		children
	}: {
		title: string;
		description?: string;
		columns: string[];
		rows: (string | number)[][];
		children: Snippet;
	} = $props();
</script>

<section class={card}>
	<h3 class="m-0 text-[1.25rem] font-bold">{title}</h3>
	{#if description}<p class="{help} mt-1! mb-4!">{description}</p>{/if}
	<div class="mt-3">{@render children()}</div>
	{#if rows.length > 0}
		<details class="mt-4 text-[0.9rem]">
			<summary class="inline-flex min-h-9 cursor-pointer items-center text-cyan-ink underline"
				>View as table</summary
			>
			<div class="mt-2 max-h-64 overflow-auto rounded-md border border-line">
				<table class="w-full text-left text-[0.85rem]">
					<caption class="sr-only">{title}</caption>
					<thead class="sticky top-0 bg-paper">
						<tr>
							{#each columns as column (column)}<th class="px-3 py-2 font-semibold">{column}</th
								>{/each}
						</tr>
					</thead>
					<tbody>
						{#each rows as row, index (index)}
							<tr class="border-t border-line">
								{#each row as cell, cellIndex (cellIndex)}<td class="px-3 py-1.5">{cell}</td>{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</details>
	{/if}
</section>

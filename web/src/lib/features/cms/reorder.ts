/** Copy of `list` with the item at `from` moved to index `to`. */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
	const next = [...list];
	const [moved] = next.splice(from, 1);
	next.splice(to, 0, moved);
	return next;
}

/**
 * Rows arranged to follow `ids`, each numbered by its position as `sort_order`.
 * Rows missing from `ids` keep their relative order at the end.
 */
export function numberedInOrder<T extends { id: string }>(
	rows: readonly T[],
	ids: readonly string[]
): T[] {
	const rank = new Map(ids.map((id, index) => [id, index]));
	return [...rows]
		.sort((a, b) => (rank.get(a.id) ?? ids.length) - (rank.get(b.id) ?? ids.length))
		.map((row, index) => ({ ...row, sort_order: index }));
}

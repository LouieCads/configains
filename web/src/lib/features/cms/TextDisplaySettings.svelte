<!--
	Lets admins adjust the font size and line spacing used by every text input,
	textarea, and select across the CMS, for comfortable reading and typing.
	Preference is per device, applied as CSS custom properties on <html> and
	kept in localStorage.
-->
<script lang="ts">
	const FONT_SIZES = [14, 15, 16, 17, 18, 19, 20, 22, 24];
	const LINE_HEIGHTS = [1.3, 1.4, 1.5, 1.6, 1.8, 2];
	const DEFAULT_FONT_SIZE = 16;
	const DEFAULT_LINE_HEIGHT = 1.5;
	const STORAGE_KEY = 'cms-text-display';

	function loadSaved(): { fontSize: number; lineHeight: number } {
		if (typeof window === 'undefined')
			return { fontSize: DEFAULT_FONT_SIZE, lineHeight: DEFAULT_LINE_HEIGHT };
		try {
			const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
			return {
				fontSize: FONT_SIZES.includes(parsed.fontSize) ? parsed.fontSize : DEFAULT_FONT_SIZE,
				lineHeight: LINE_HEIGHTS.includes(parsed.lineHeight)
					? parsed.lineHeight
					: DEFAULT_LINE_HEIGHT
			};
		} catch {
			return { fontSize: DEFAULT_FONT_SIZE, lineHeight: DEFAULT_LINE_HEIGHT };
		}
	}

	const saved = loadSaved();
	let fontSize = $state(saved.fontSize);
	let lineHeight = $state(saved.lineHeight);
	let announcement = $state('');

	$effect(() => {
		document.documentElement.style.setProperty('--cms-input-font-size', `${fontSize}px`);
		document.documentElement.style.setProperty('--cms-input-line-height', String(lineHeight));
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({ fontSize, lineHeight }));
		} catch {
			// Storage unavailable (private browsing); preference just won't persist.
		}
	});

	function step(list: number[], current: number, direction: number): number {
		return list[list.indexOf(current) + direction] ?? current;
	}
	function changeFontSize(direction: number) {
		fontSize = step(FONT_SIZES, fontSize, direction);
		announcement = `Text size: ${fontSize}px.`;
	}
	function changeLineHeight(direction: number) {
		lineHeight = step(LINE_HEIGHTS, lineHeight, direction);
		announcement = `Line spacing: ${lineHeight}.`;
	}
</script>

<details class="text-display-settings">
	<summary class="cms-secondary">Text display</summary>
	<div class="text-display-controls">
		<div class="text-display-row">
			<span>Font size</span>
			<button
				type="button"
				aria-label="Decrease font size"
				disabled={fontSize === FONT_SIZES[0]}
				onclick={() => changeFontSize(-1)}>A-</button
			>
			<span class="text-display-value">{fontSize}px</span>
			<button
				type="button"
				aria-label="Increase font size"
				disabled={fontSize === FONT_SIZES[FONT_SIZES.length - 1]}
				onclick={() => changeFontSize(1)}>A+</button
			>
		</div>
		<div class="text-display-row">
			<span>Line spacing</span>
			<button
				type="button"
				aria-label="Decrease line spacing"
				disabled={lineHeight === LINE_HEIGHTS[0]}
				onclick={() => changeLineHeight(-1)}>-</button
			>
			<span class="text-display-value">{lineHeight}</span>
			<button
				type="button"
				aria-label="Increase line spacing"
				disabled={lineHeight === LINE_HEIGHTS[LINE_HEIGHTS.length - 1]}
				onclick={() => changeLineHeight(1)}>+</button
			>
		</div>
	</div>
	<p class="cms-visually-hidden" aria-live="polite">{announcement}</p>
</details>

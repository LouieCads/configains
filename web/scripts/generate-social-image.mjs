import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const font = await readFile(new URL('./assets/BebasNeue-Regular.ttf', import.meta.url));
const browser = await chromium.launch({ headless: true });
try {
	const page = await browser.newPage({
		viewport: { width: 1200, height: 630 },
		deviceScaleFactor: 1
	});
	await page.setContent(`<!doctype html><html><head><style>
		@font-face { font-family: Bebas; src: url(data:font/ttf;base64,${font.toString('base64')}) }
		* { box-sizing: border-box }
		body { margin: 0; color: #182a30; background: #fcfdfb; font-family: Arial, sans-serif }
		.card { width: 1200px; height: 630px; padding: 48px 60px; position: relative; overflow: hidden;
			background-image: radial-gradient(#182a300d .8px, transparent .8px); background-size: 8px 8px }
		.top { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #182a302b; padding-bottom: 18px }
		.brand { font-family: Bebas; font-size: 54px; line-height: 1; color: #157f90 }
		.coach { font-size: 16px; letter-spacing: 2px; font-weight: bold }
		.main { position: relative; margin-top: 41px }
		.eyebrow { font-size: 15px; font-weight: bold; letter-spacing: 2.8px; margin-bottom: 19px }
		h1 { font: 112px/.94 Bebas; margin: 0; letter-spacing: .1px; position: relative; z-index: 1 }
		h1 span { color: #157f90 }
		.copy { font-size: 23px; line-height: 1.45; margin: 22px 0 0; width: 650px }
		.visual { position: absolute; right: 0; top: 0; width: 306px; height: 306px; background: #59d9e8; border-radius: 50% }
		.visual svg { width: 100%; height: 100% }
		.bottom { position: absolute; bottom: 43px; left: 60px; right: 60px; display: flex; align-items: center; justify-content: space-between;
			border-top: 1px solid #182a302b; padding-top: 22px; font-size: 16px }
		.promise { font-weight: bold }
		.url { color: #56676b }
	</style></head><body><main class="card">
		<header class="top"><div class="brand">CONFIGAINS.</div><div class="coach">COACHING BY CASH FUERTE</div></header>
		<section class="main"><div class="eyebrow">ONLINE FITNESS &amp; NUTRITION COACHING</div>
		<h1>BUILD STRENGTH.<br><span>MAKE IT LAST.</span></h1>
		<p class="copy">Personal coaching. Practical training.<br>Progress that fits your life.</p>
		<div class="visual"><svg viewBox="0 0 306 306" fill="none" xmlns="http://www.w3.org/2000/svg">
			<circle cx="153" cy="153" r="128" stroke="#182a30" stroke-opacity=".17"/>
			<circle cx="153" cy="153" r="100" stroke="#182a30" stroke-opacity=".17"/>
			<g transform="rotate(-35 153 153)" stroke="#182a30" stroke-width="10" stroke-linejoin="round">
				<path d="M112 146H194V160H112Z" fill="#fcfdfb"/>
				<rect x="81" y="105" width="31" height="96" rx="7" fill="#182a30"/>
				<rect x="58" y="125" width="23" height="56" rx="5" fill="#fcfdfb"/>
				<rect x="194" y="105" width="31" height="96" rx="7" fill="#182a30"/>
				<rect x="225" y="125" width="23" height="56" rx="5" fill="#fcfdfb"/>
			</g>
		</svg></div></section>
		<footer class="bottom"><span class="promise">REAL LIFE. REAL PROGRESS.</span><span class="url">configains.fundrstudio.com</span></footer>
	</main></body></html>`);
	await page.evaluate(() => document.fonts.ready);
	await page.screenshot({
		path: fileURLToPath(new URL('../static/og-image.png', import.meta.url))
	});
	console.log('Generated static/og-image.png (1200 × 630).');
} finally {
	await browser.close();
}

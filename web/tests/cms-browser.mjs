import http from 'node:http';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { checkRecovery } from './recovery-checks.mjs';

const backendPort = 55479,
	appPort = 5187;
const origin = 'http://127.0.0.1:' + appPort;
const adminId = '11000000-0000-0000-0000-000000000001';
const memberId = '11000000-0000-0000-0000-000000000002';
const rows = { site_content: [], testimonials: [], transformations: [] };
const recovery = {
	password: 'local-test-password',
	tokens: new Map(),
	emails: [],
	verifications: 0,
	updates: 0
};
let appOutput = '',
	debugPage;
let sequence = 0,
	uploads = 0,
	app,
	browser;
const now = () => new Date(Date.now() + sequence++).toISOString();
const userFor = (id) => ({
	id,
	aud: 'authenticated',
	role: 'authenticated',
	email: id === adminId ? 'admin@example.test' : 'member@example.test',
	app_metadata: { provider: 'email' },
	user_metadata: {},
	created_at: '2026-01-01T00:00:00Z'
});
const tokenFor = (id) =>
	[
		Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
		Buffer.from(
			JSON.stringify({
				sub: id,
				aud: 'authenticated',
				exp: Math.floor(Date.now() / 1000) + 3600,
				iat: Math.floor(Date.now() / 1000),
				role: 'authenticated',
				email: userFor(id).email
			})
		).toString('base64url'),
		Buffer.from('local-test-signature').toString('base64url')
	].join('.');
const backend = http.createServer(async (req, res) => {
	const url = new URL(req.url, 'http://localhost');
	let raw = '';
	for await (const chunk of req) raw += chunk;
	let body = {};
	if (req.headers['content-type']?.includes('application/json')) body = JSON.parse(raw || '{}');
	let id;
	try {
		id = JSON.parse(
			Buffer.from((req.headers.authorization || '').split('.')[1], 'base64url').toString()
		).sub;
	} catch {
		/* Anonymous request. */
	}
	const admin = id === adminId;
	const send = (data, status = 200) => {
		res.writeHead(status, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify(data));
	};
	if (url.pathname === '/auth/v1/token') {
		if (
			body.password !==
			(body.email === 'admin@example.test' ? recovery.password : 'local-test-password')
		)
			return send({ error: 'invalid_credentials', message: 'Invalid login credentials' }, 400);
		const uid = body.email === 'admin@example.test' ? adminId : memberId;
		return send({
			access_token: tokenFor(uid),
			token_type: 'bearer',
			expires_in: 3600,
			expires_at: Math.floor(Date.now() / 1000) + 3600,
			refresh_token: 'local-refresh',
			user: userFor(uid)
		});
	}
	if (url.pathname === '/auth/v1/recover') {
		if (body.email === 'limited@example.test')
			return send({ code: 'over_email_send_rate_limit', message: 'Rate limit' }, 429);
		if (body.email === 'smtp-failed@example.test')
			return send({ message: 'SMTP unavailable' }, 500);
		if (['admin@example.test', 'member@example.test'].includes(body.email)) {
			const token = crypto.randomUUID().replaceAll('-', '').repeat(2);
			recovery.tokens.set(token, {
				id: body.email === 'admin@example.test' ? adminId : memberId,
				used: false
			});
			recovery.emails.push({ email: body.email, token });
		}
		return send({});
	}
	if (url.pathname === '/auth/v1/verify') {
		recovery.verifications++;
		const token = recovery.tokens.get(body.token_hash);
		if (body.type !== 'recovery' || !token || token.used)
			return send({ code: 'otp_expired', message: 'Invalid or used recovery token' }, 403);
		token.used = true;
		return send({
			access_token: tokenFor(token.id),
			token_type: 'bearer',
			expires_in: 3600,
			refresh_token: 'local-recovery-refresh',
			user: userFor(token.id)
		});
	}
	if (url.pathname === '/auth/v1/user' && req.method === 'PUT') {
		if (!admin) return send({ message: 'Forbidden' }, 403);
		recovery.password = body.password;
		recovery.updates++;
		return send(userFor(id));
	}
	if (url.pathname === '/auth/v1/user')
		return id ? send(userFor(id)) : send({ message: 'No session' }, 401);
	if (url.pathname === '/auth/v1/logout') return send({});
	if (url.pathname.startsWith('/storage/v1/object/')) {
		if (!admin) return send({ message: 'Forbidden' }, 403);
		uploads++;
		return send({ Key: url.pathname.slice('/storage/v1/object/'.length), Id: crypto.randomUUID() });
	}
	if (url.pathname === '/rest/v1/admin_profiles') return send(admin ? [{ id: adminId }] : []);
	if (url.pathname.startsWith('/rest/v1/rpc/')) {
		if (!admin) return send({ code: '42501', message: 'Forbidden' }, 403);
		const draft = rows.site_content.find((row) => row.key === 'website.draft');
		if (body.expected_revision !== (draft?.updated_at ?? null))
			return send({ code: '40001', message: 'Draft changed' }, 409);
		if (url.pathname.endsWith('/save_website_draft')) {
			const revision = now();
			if (draft) Object.assign(draft, { metadata: body.content, updated_at: revision });
			else
				rows.site_content.push({
					id: crypto.randomUUID(),
					key: 'website.draft',
					metadata: body.content,
					updated_at: revision
				});
			return send(revision);
		}
		if (url.pathname.endsWith('/publish_website_content') && draft) {
			const revision = now(),
				published = rows.site_content.find((row) => row.key === 'website');
			if (published)
				Object.assign(published, {
					metadata: structuredClone(draft.metadata),
					updated_at: revision
				});
			else
				rows.site_content.push({
					id: crypto.randomUUID(),
					key: 'website',
					metadata: structuredClone(draft.metadata),
					updated_at: revision
				});
			return send(revision);
		}
		return send({ message: 'Unknown RPC' }, 400);
	}
	const table = url.pathname.split('/').at(-1);
	if (!(table in rows)) return send({ message: 'Unknown mock endpoint: ' + url.pathname }, 404);
	let matches = rows[table].filter(
		(row) => admin || (table === 'site_content' ? row.key !== 'website.draft' : row.is_published)
	);
	for (const [key, value] of url.searchParams) {
		if (value.startsWith('eq.'))
			matches = matches.filter((row) => String(row[key]) === value.slice(3));
	}
	const order = url.searchParams.get('order');
	if (order) {
		const [field, direction] = order.split('.');
		matches.sort(
			(a, b) => String(a[field]).localeCompare(String(b[field])) * (direction === 'desc' ? -1 : 1)
		);
	}
	if (url.searchParams.has('limit'))
		matches = matches.slice(0, Number(url.searchParams.get('limit')));
	if (req.method === 'HEAD') {
		res.writeHead(200, {
			'content-range': '0-' + Math.max(0, matches.length - 1) + '/' + matches.length
		});
		return res.end();
	}
	if (req.method !== 'GET' && !admin) return send({ message: 'Forbidden' }, 403);
	if (req.method === 'POST') {
		const row = {
			id: crypto.randomUUID(),
			created_at: now(),
			updated_at: now(),
			is_published: false,
			...body
		};
		rows[table].push(row);
		return send(req.headers.accept?.includes('object') ? row : [row], 201);
	}
	if (req.method === 'PATCH') {
		matches.forEach((row) => Object.assign(row, body, { updated_at: now() }));
		return send(req.headers.accept?.includes('object') ? matches[0] : matches);
	}
	if (req.method === 'DELETE') {
		rows[table] = rows[table].filter((row) => !matches.includes(row));
		res.writeHead(204);
		return res.end();
	}
	return send(req.headers.accept?.includes('object') ? matches[0] || null : matches);
});
await new Promise((resolve) => backend.listen(backendPort, '127.0.0.1', resolve));
const notes = [];
try {
	app = spawn(
		process.execPath,
		[
			'node_modules/vite/bin/vite.js',
			'--host',
			'127.0.0.1',
			'--port',
			String(appPort),
			'--strictPort'
		],
		{
			cwd: process.cwd(),
			env: {
				...process.env,
				LOCAL_ADMIN_DEMO: 'false',
				PUBLIC_SUPABASE_URL: 'http://127.0.0.1:' + backendPort,
				PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'local-cms-test-key'
			},
			stdio: ['ignore', 'pipe', 'pipe']
		}
	);

	app.stdout.on('data', (chunk) => {
		appOutput += chunk;
	});
	app.stderr.on('data', (chunk) => {
		appOutput += chunk;
	});
	for (let i = 0; i < 120; i++) {
		try {
			if ((await fetch(origin + '/admin/login')).ok) break;
		} catch {
			/* Wait for startup. */
		}
		if (app.exitCode !== null) throw new Error(appOutput);
		if (i === 119) throw new Error('Vite startup timed out. ' + appOutput);
		await new Promise((resolve) => setTimeout(resolve, 500));
	}
	browser = await chromium.launch({ headless: true });
	const context = await browser.newContext();
	const page = await context.newPage();
	debugPage = page;
	const failures = [];

	page.on('pageerror', (error) => failures.push(error.message));
	await mkdir('.audit/screenshots', { recursive: true });

	for (const width of [320, 390, 768, 1280]) {
		await page.setViewportSize({ width, height: 850 });
		for (const path of ['/', '/about', '/coaching', '/transformations', '/contact']) {
			const response = await page.goto(origin + path);
			assert.equal(response.status(), 200, path);
			await page.waitForTimeout(120);
			const overflow = await page.evaluate(
				() => document.documentElement.scrollWidth > window.innerWidth + 1
			);
			assert.equal(overflow, false, 'Horizontal overflow at ' + width + ' on ' + path);
			assert.equal(await page.locator('h1').count(), 1, 'One main heading on ' + path);
			if ([390, 1280].includes(width) && ['/', '/contact'].includes(path))
				await page.screenshot({
					path: '.audit/screenshots/' + (path === '/' ? 'home' : 'contact') + '-' + width + '.png',
					fullPage: true
				});
			assert.equal(
				await page.locator('a[href*="/admin"]').count(),
				0,
				'Public admin link on ' + path
			);
		}
	}
	await page.setViewportSize({ width: 390, height: 850 });
	await page.goto(origin + '/about');
	await page.getByRole('button', { name: /menu/i }).click();
	assert.equal(await page.locator('#mobile-nav').isVisible(), true);
	await page.keyboard.press('Escape');
	assert.equal(await page.locator('#mobile-nav').isVisible(), false);
	await page.screenshot({ path: '.audit/screenshots/about-mobile.png', fullPage: true });
	notes.push(
		'Five public routes: 320/390/768/1280 widths, one H1, no overflow, no public admin links, mobile menu.'
	);

	await page.goto(origin + '/');
	assert.equal(
		await page.locator('link[rel="canonical"]').getAttribute('href'),
		'https://configains.fundrstudio.com/'
	);
	const structured = JSON.parse(
		await page.locator('script[type="application/ld+json"]').textContent()
	);
	assert(
		structured['@graph'].some(
			(entry) => entry['@type'] === 'Person' && entry.name === 'Cash Fuerte'
		)
	);
	assert(structured['@graph'].some((entry) => entry['@type'] === 'FAQPage'));
	assert.equal((await fetch(origin + '/og-image.png')).status, 200);
	const sitemap = await (await fetch(origin + '/sitemap.xml')).text();
	assert(sitemap.includes('https://configains.fundrstudio.com/coaching'));
	assert.equal((sitemap.match(/<url>/g) || []).length, 5);
	assert((await (await fetch(origin + '/robots.txt')).text()).includes('Disallow: /admin'));
	assert((await (await fetch(origin + '/llms.txt')).text()).includes('Cash Fuerte'));
	assert.equal((await fetch(origin + '/?preview=1', { redirect: 'manual' })).status, 303);
	assert.equal((await fetch(origin + '/api/site-content')).status, 401);
	notes.push(
		'Canonical, JSON-LD, social card, five-page sitemap, robots, llms.txt, and private preview.'
	);

	await page.goto(origin + '/admin/login');
	await page.waitForTimeout(1500);
	assert.equal(
		await page.locator('meta[name="robots"]').getAttribute('content'),
		'noindex, nofollow'
	);
	await page.getByLabel('Email').fill('member@example.test');
	await page.getByLabel('Password').fill('local-test-password');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await page.getByRole('alert').waitFor();
	assert((await page.getByRole('alert').textContent()).includes('administrator access'));
	await page.getByLabel('Email').fill('admin@example.test');
	await page.getByLabel('Password').fill('local-test-password');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await page.waitForURL('**/admin/dashboard');
	await page.setViewportSize({ width: 1280, height: 850 });
	await page.goto(origin + '/admin/content');
	await page.getByLabel('First headline line').fill('TEST YOUR STRENGTH.');
	await page.getByText('Unsaved changes', { exact: true }).waitFor();
	assert.equal(await page.getByLabel('Page title', { exact: true }).count(), 0);
	await page.getByRole('tab', { name: 'Hero', exact: true }).click();
	await page.keyboard.press('End');
	await page.getByRole('tabpanel', { name: 'SEO', exact: true }).waitFor();
	assert.equal(
		await page.getByRole('tab', { name: 'SEO', exact: true }).getAttribute('aria-selected'),
		'true'
	);
	await page.getByLabel('Page title', { exact: true }).fill('Configains CMS tab test');
	await page.keyboard.press('Shift+Tab');
	await page.getByRole('tab', { name: 'Hero', exact: true }).click();
	assert.equal(await page.getByLabel('First headline line').inputValue(), 'TEST YOUR STRENGTH.');
	await page.getByRole('button', { name: 'Questions and answers', exact: true }).click();
	await page.getByRole('tab', { name: 'Questions', exact: true }).click();
	assert.equal(await page.locator('.editor-tab-content details[open]').count(), 0);
	const faqEntry = page.locator('.editor-tab-content details').first();
	await faqEntry.locator('summary').click();
	await faqEntry.getByLabel('Question', { exact: true }).fill('What is a tabbed CMS?');
	await faqEntry.getByLabel('Answer', { exact: true }).fill('It keeps website sections organized.');
	await faqEntry.getByRole('button', { name: 'Move Question and answer 1 down' }).click();
	const movedFaq = page.locator('.editor-tab-content details').nth(1);
	assert.equal(
		await movedFaq.getByLabel('Question', { exact: true }).inputValue(),
		'What is a tabbed CMS?'
	);
	assert.equal(await movedFaq.getAttribute('open'), '');
	await movedFaq.getByRole('button', { name: 'Move Question and answer 2 up' }).click();
	await page.getByRole('button', { name: '+ Add question and answer', exact: true }).click();
	const newFaq = page.locator('.editor-tab-content details').last();
	assert.equal(await newFaq.getAttribute('open'), '');
	await newFaq.getByLabel('Question', { exact: true }).fill('Temporary question');
	await newFaq.getByRole('button', { name: 'Remove', exact: true }).click();
	assert.equal(await page.locator('.editor-tab-content details').count(), 5);
	await page.getByRole('button', { name: 'Assessment and contact page', exact: true }).click();
	await page.getByRole('tab', { name: 'Training', exact: true }).click();
	assert.equal(await page.locator('.editor-tab-content details').count(), 4);
	assert.equal(await page.locator('.editor-tab-content details[open]').count(), 0);
	const trainingEntry = page.locator('.editor-tab-content details').first();
	await trainingEntry.locator('summary').click();
	await trainingEntry
		.getByLabel('Question', { exact: true })
		.fill('How much experience do you have with training?');
	await page.getByRole('button', { name: 'Home page', exact: true }).click();
	assert.equal(
		await page.getByRole('tab', { name: 'Hero', exact: true }).getAttribute('aria-selected'),
		'true'
	);
	assert.equal(await page.getByLabel('First headline line').inputValue(), 'TEST YOUR STRENGTH.');
	await page.getByRole('button', { name: 'Save draft', exact: true }).first().click();
	await page.getByRole('status').filter({ hasText: 'Draft saved.' }).waitFor();
	const tabDraft = rows.site_content.find((row) => row.key === 'website.draft').metadata;
	assert.equal(tabDraft.home.seo.title, 'Configains CMS tab test');
	assert.equal(tabDraft.faq.items[0].question, 'What is a tabbed CMS?');
	assert.equal(
		tabDraft.contact.trainingExperience.label,
		'How much experience do you have with training?'
	);
	notes.push(
		'Section tabs retain unsaved edits across pages; keyboard navigation, collapsed questions, list add/remove/reorder, and saving all tabs work.'
	);
	assert(!(await (await fetch(origin + '/')).text()).includes('TEST YOUR STRENGTH.'));
	const preview = await context.newPage();
	const previewResponse = await preview.goto(origin + '/?preview=1');
	assert.equal(previewResponse.headers()['cache-control'], 'private, no-store');
	assert.equal(
		await preview
			.locator('h1')
			.textContent()
			.then((value) => value.includes('TEST YOUR STRENGTH.')),
		true
	);
	assert.equal(
		await preview.locator('meta[name="robots"]').getAttribute('content'),
		'noindex, nofollow'
	);
	await preview.close();
	page.on('dialog', (dialog) => dialog.accept());
	await page.getByRole('button', { name: 'Publish website', exact: true }).click();
	await page.getByRole('status').filter({ hasText: 'Published.' }).waitFor();
	assert((await (await fetch(origin + '/')).text()).includes('TEST YOUR STRENGTH.'));
	await page.getByRole('button', { name: 'Brand and contact', exact: true }).click();
	await page.getByRole('tab', { name: 'Coach', exact: true }).click();
	await page.getByLabel('Coach portrait').locator('..').getByRole('textbox').fill('/og-image.png');
	const fileInput = page.locator('input[type=file]').first();
	await fileInput.setInputFiles({
		name: 'coach.png',
		mimeType: 'image/png',
		buffer: Buffer.from(
			'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jL1kAAAAASUVORK5CYII=',
			'base64'
		)
	});
	await page.waitForFunction(() =>
		document.querySelector('#field-brand-portrait')?.value.includes('/storage/')
	);
	assert.equal(uploads, 1);
	const oversizedImage = Buffer.alloc(4 * 1024 * 1024 + 1);
	await fileInput.setInputFiles({
		name: 'too-large.png',
		mimeType: 'image/png',
		buffer: oversizedImage
	});
	await page.getByRole('alert').filter({ hasText: 'up to 4 MB' }).waitFor();
	assert.equal(uploads, 1, 'Oversized file must not reach Storage');
	const oversizedStatus = await page.evaluate(async () => {
		const body = new FormData();
		body.set('bucket', 'site');
		body.set(
			'file',
			new File([new Uint8Array(4 * 1024 * 1024 + 1)], 'too-large.png', { type: 'image/png' })
		);
		return (await fetch('/api/uploads', { method: 'POST', body })).status;
	});
	assert.equal(oversizedStatus, 400);
	assert.equal(uploads, 1);
	await page.getByLabel('Coach portrait', { exact: true }).fill('/og-image.png');
	await page.getByRole('button', { name: 'Save draft', exact: true }).first().click();
	await page.getByRole('status').filter({ hasText: 'Draft saved.' }).waitFor();
	await page.setViewportSize({ width: 1280, height: 850 });
	await page.screenshot({ path: '.audit/screenshots/cms-desktop.png', fullPage: true });
	notes.push(
		'Login denies nonadmins; admin saves private draft, previews it, publishes, and uploads images.'
	);

	const api = async (method, data, headers = {}) => {
		const result = await page.evaluate(
			async ({ origin, method, data, headers }) => {
				const response = await fetch(origin + '/api/site-content', {
					method,
					headers: { 'Content-Type': 'application/json', ...headers },
					...(method !== 'GET' ? { body: JSON.stringify(data) } : {})
				});
				return { status: response.status, body: await response.json() };
			},
			{ origin, method, data, headers }
		);
		return { status: () => result.status, json: async () => result.body };
	};
	const state = await (await api('GET')).json();
	assert.equal(
		(await api('PUT', { content: state.content, revision: '2000-01-01T00:00:00.000Z' })).status(),
		409
	);
	assert.equal((await api('POST', { revision: '2000-01-01T00:00:00.000Z' })).status(), 409);
	assert.equal((await api('PUT', null)).status(), 400);
	assert.equal(
		(
			await context.request.put(origin + '/api/site-content', {
				data: { content: state.content, revision: state.revision },
				headers: { Origin: 'https://foreign.example' }
			})
		).status(),
		403
	);
	state.content.home.seo.title = 'Configains edited search title';
	state.content.faq.items[0] = { question: 'CMS question?', answer: 'CMS published answer.' };
	const saved = await (
		await api('PUT', { content: state.content, revision: state.revision })
	).json();
	assert.equal((await api('POST', { revision: saved.revision })).status(), 200);
	const html = await (await fetch(origin + '/')).text();
	assert(html.includes('Configains edited search title'));
	assert(html.includes('CMS published answer.'));
	assert((await (await fetch(origin + '/llms.txt')).text()).includes('CMS published answer.'));
	notes.push(
		'Stale saves/publishes return 409; cross-origin writes denied; publishing updates visible FAQ, SEO and llms together.'
	);

	await page.goto(origin + '/admin/testimonials');
	await page.getByText('+ Add new item', { exact: true }).click();
	await page.getByLabel('Client name', { exact: true }).fill('Consent test client');
	await page.getByLabel('Quote', { exact: true }).fill('A locally tested story.');
	page.removeAllListeners('dialog');
	let navigationWarnings = 0;
	const cancelNavigation = async (dialog) => {
		navigationWarnings++;
		await dialog.dismiss();
	};
	page.on('dialog', cancelNavigation);
	await page
		.getByText('You have unsaved changes or an operation in progress.', { exact: true })
		.waitFor();
	await Promise.all([
		page.waitForEvent('dialog'),
		page.getByRole('link', { name: 'Content', exact: true }).click()
	]);
	assert.equal(navigationWarnings, 1);
	assert.equal(new URL(page.url()).pathname, '/admin/testimonials');
	assert.equal(
		await page.getByLabel('Quote', { exact: true }).inputValue(),
		'A locally tested story.'
	);
	assert.equal(
		await page.evaluate(
			() => !window.dispatchEvent(new Event('beforeunload', { cancelable: true }))
		),
		true
	);
	page.removeListener('dialog', cancelNavigation);
	page.on('dialog', (dialog) => dialog.accept());
	await page.getByRole('button', { name: 'Create item', exact: true }).click();
	await page.getByRole('button', { name: 'Save item', exact: true }).waitFor();
	await page
		.getByText('You have unsaved changes or an operation in progress.', { exact: true })
		.waitFor({ state: 'hidden' });
	assert.equal(
		await page.evaluate(
			() => !window.dispatchEvent(new Event('beforeunload', { cancelable: true }))
		),
		false
	);
	assert(!(await (await fetch(origin + '/')).text()).includes('Consent test client'));
	await page.locator('form.cms-card').last().getByLabel('Published', { exact: true }).check();
	await page.getByRole('button', { name: 'Save item', exact: true }).click();
	await page.getByRole('status').filter({ hasText: 'Saved.' }).last().waitFor();
	assert((await (await fetch(origin + '/')).text()).includes('Consent test client'));
	await page.getByRole('button', { name: 'Delete item', exact: true }).click();
	await page.getByRole('button', { name: 'Save item', exact: true }).waitFor({ state: 'detached' });
	assert(!(await (await fetch(origin + '/')).text()).includes('Consent test client'));
	notes.push(
		'Client stories remain unpublished until enabled; create, publish, and delete reflect on the public site.'
	);
	await page.goto(origin + '/admin/transformations');
	await page.getByText('+ Add new item', { exact: true }).click();
	await page.getByLabel('Title', { exact: true }).fill('Unsaved transformation');
	await page
		.getByText('You have unsaved changes or an operation in progress.', { exact: true })
		.waitFor();
	page.removeAllListeners('dialog');
	page.on('dialog', cancelNavigation);
	await Promise.all([
		page.waitForEvent('dialog'),
		page.getByRole('link', { name: 'Content', exact: true }).click()
	]);
	assert.equal(navigationWarnings, 2);
	assert.equal(new URL(page.url()).pathname, '/admin/transformations');
	await page.getByRole('button', { name: 'Create item', exact: true }).click();
	await page
		.getByText('You have unsaved changes or an operation in progress.', { exact: true })
		.waitFor({ state: 'hidden' });
	page.removeListener('dialog', cancelNavigation);
	page.on('dialog', (dialog) => dialog.accept());
	await page.getByRole('button', { name: 'Delete item', exact: true }).click();
	await page.getByRole('button', { name: 'Save item', exact: true }).waitFor({ state: 'detached' });
	notes.push(
		'4 MB client and API upload limits; testimonial and transformation navigation warnings retain edits and clear after saving.'
	);

	await page.goto(origin + '/admin/content');
	for (const width of [320, 390, 768, 1280]) {
		await page.setViewportSize({ width, height: 850 });
		if (width < 760) {
			await page.getByLabel('Page or shared content').selectOption('contact');
			await page.getByRole('tab', { name: 'Training', exact: true }).click();
		} else {
			await page.getByRole('button', { name: 'Assessment and contact page', exact: true }).click();
		}
		assert.equal(
			await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1),
			false,
			'CMS overflow at ' + width
		);
	}
	await page.setViewportSize({ width: 390, height: 850 });
	await page.screenshot({ path: '.audit/screenshots/cms-mobile.png', fullPage: true });
	await page.getByRole('button', { name: 'Sign out' }).click();
	await page.waitForURL('**/admin/login');
	assert.equal((await context.request.get(origin + '/api/site-content')).status(), 401);
	await checkRecovery({ page, context, browser, origin, recovery, failures });
	notes.push(
		'Recovery verifies single-use tokens and administrator access, works in a fresh browser, protects passwords, and handles invalid links and delivery errors.'
	);
	assert.deepEqual(failures, []);
	await writeFile(
		'.audit/browser-results.json',
		JSON.stringify({ passed: true, checks: notes, pageErrors: failures }, null, 2)
	);
	console.log(JSON.stringify({ passed: true, checks: notes }, null, 2));
} catch (error) {
	console.error(appOutput);
	if (debugPage) {
		console.error(await debugPage.locator('body').innerText());
		await debugPage.screenshot({ path: '.audit/screenshots/failure.png', fullPage: true });
	}
	console.error(error);
	throw error;
} finally {
	await browser?.close();
	app?.kill();
	await new Promise((resolve) => backend.close(resolve));
}

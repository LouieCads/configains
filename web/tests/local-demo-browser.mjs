import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const instance = 'browser-test-' + crypto.randomUUID(),
	port = 5189;
let app,
	browser,
	output = '';
async function start(production = false) {
	const origin = 'http://127.0.0.1:' + (production ? 5190 : port);
	app = spawn(
		process.execPath,
		[
			'node_modules/vite/bin/vite.js',
			...(production ? ['preview'] : []),
			'--host',
			'127.0.0.1',
			'--port',
			production ? '5190' : String(port),
			'--strictPort'
		],
		{
			env: {
				...process.env,
				LOCAL_ADMIN_DEMO: 'true',
				LOCAL_ADMIN_DEMO_INSTANCE: instance,
				...(production
					? {}
					: {
							PUBLIC_SUPABASE_URL: 'http://127.0.0.1:9',
							PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'isolated-local-demo'
						})
			},
			stdio: ['ignore', 'pipe', 'pipe']
		}
	);
	app.stdout.on('data', (data) => {
		output += data;
	});
	app.stderr.on('data', (data) => {
		output += data;
	});
	for (let attempt = 0; attempt < 100; attempt++) {
		try {
			if ((await fetch(origin + '/api/site-content')).status === 401) return origin;
		} catch {
			/* Wait for Vite. */
		}
		if (app.exitCode !== null) throw new Error(output);
		await new Promise((resolve) => setTimeout(resolve, 300));
	}
	throw new Error('Local demo startup timed out. ' + output);
}
async function stop() {
	if (app && app.exitCode === null) {
		const finished = new Promise((resolve) => app.once('exit', resolve));
		app.kill();
		await finished;
	}
}
try {
	const origin = await start();
	assert.equal(
		(
			await fetch(origin + '/api/site-content', {
				headers: { Cookie: 'configains-local-demo=forged' }
			})
		).status,
		401
	);
	browser = await chromium.launch({ headless: true });
	const context = await browser.newContext();
	let page = await context.newPage();
	const pageErrors = [];
	page.on('pageerror', (error) => pageErrors.push(error.message));
	async function enter() {
		await page.goto(origin + '/admin/login');
		await page.waitForTimeout(1200);
		assert.equal(await page.locator('input[name=email], input[name=password]').count(), 0);
		await page.getByRole('button', { name: 'Sign in', exact: true }).click();
		await page.waitForURL('**/admin/dashboard');
	}
	await enter();
	for (const path of ['/admin/forgot-password', '/admin/recover']) {
		const blocked = await context.request.post(origin + path, {
			headers: { Origin: origin },
			form: { email: 'admin@example.test', token_hash: 'x'.repeat(64) }
		});
		assert.equal(blocked.status(), 400, 'Recovery must not contact Supabase in local demo mode');
	}
	for (const path of ['/admin/content', '/admin/testimonials', '/admin/transformations'])
		assert.equal((await context.request.get(origin + path)).status(), 200);
	const request = (path, method = 'GET', data) =>
		context.request.fetch(origin + path, { method, headers: { Origin: origin }, data });
	const document = await (await request('/api/site-content')).json();
	const headline = 'ISOLATED LOCAL DEMO ' + instance;
	document.content.home.hero.firstLine = headline;
	const saved = await request('/api/site-content', 'PUT', {
		content: document.content,
		revision: document.revision
	});
	assert.equal(saved.status(), 200);
	const revision = (await saved.json()).revision;
	assert(!(await (await fetch(origin + '/')).text()).includes(headline));
	assert((await (await context.request.get(origin + '/?preview=1')).text()).includes(headline));
	assert.equal((await request('/api/site-content', 'POST', { revision })).status(), 200);
	assert((await (await fetch(origin + '/')).text()).includes(headline));
	assert.equal(
		(
			await request('/api/site-content', 'PUT', { content: document.content, revision: null })
		).status(),
		409
	);
	const image = await context.request.post(origin + '/api/uploads', {
		headers: { Origin: origin },
		multipart: {
			bucket: 'site',
			file: {
				name: 'demo.png',
				mimeType: 'image/png',
				buffer: Buffer.from(
					'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jL1kAAAAASUVORK5CYII=',
					'base64'
				)
			}
		}
	});
	assert.equal(image.status(), 201);
	const mediaUrl = (await image.json()).url;
	assert(mediaUrl.startsWith('/api/local-media/'));
	assert.equal((await fetch(origin + mediaUrl)).headers.get('content-type'), 'image/png');
	const story = await request('/api/cms/testimonials', 'POST', {
		name: 'Local story',
		quote: 'Demo only.',
		is_published: true
	});
	assert.equal(story.status(), 201);
	assert((await (await fetch(origin + '/')).text()).includes('Local story'));
	assert.equal(
		(await request('/api/cms/testimonials?id=' + (await story.json()).id, 'DELETE')).status(),
		204
	);
	await page.goto(origin + '/admin/content');
	assert(
		(await page.locator('body').textContent()).includes('edits and publishing stay on this device')
	);
	await page.close();
	await stop();
	assert.equal(await start(), origin);
	page = await context.newPage();
	page.on('pageerror', (error) => pageErrors.push(error.message));
	assert((await (await fetch(origin + '/')).text()).includes(headline));
	assert.equal((await context.request.get(origin + '/api/site-content')).status(), 401);
	await enter();
	await page.getByRole('button', { name: 'Sign out', exact: true }).click();
	await page.waitForURL('**/admin/login');
	assert.equal((await context.request.get(origin + '/api/site-content')).status(), 401);
	assert.deepEqual(pageErrors, []);
	await stop();

	const production = await start(true);
	assert.equal(
		(
			await fetch(production + '/api/site-content', {
				headers: { Cookie: 'configains-local-demo=forged' }
			})
		).status,
		401
	);
	assert.equal((await fetch(production + mediaUrl)).status, 404);
	const login = await fetch(production + '/admin/login', {
		method: 'POST',
		headers: {
			Origin: production,
			Accept: 'application/json',
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: '',
		redirect: 'manual'
	});
	const failedAction = await login.json();
	assert.equal(failedAction.type, 'failure', 'A production build accepted credential-free login');
	assert.equal(failedAction.status, 400);
	assert(JSON.stringify(failedAction).includes('Email and password are required.'));
	console.log(
		'PASS: one-click local login, private drafts, local publishing/uploads/stories, persistent edits, logout, forged-cookie rejection, and production authentication.'
	);
} catch (error) {
	console.error(output);
	throw error;
} finally {
	await browser?.close();
	await stop();
}

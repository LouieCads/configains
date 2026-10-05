import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

// Run against a production build: SvelteKit disables its built-in CSRF check in dev.
const adminId = '11000000-0000-0000-0000-000000000001';
const user = {
	id: adminId,
	aud: 'authenticated',
	role: 'authenticated',
	email: 'admin@example.test',
	app_metadata: { provider: 'email' },
	user_metadata: {},
	created_at: '2026-01-01T00:00:00Z'
};
let sequence = 0;
let signOuts = 0;
const revoked = new Set();
const backend = http.createServer(async (req, res) => {
	const url = new URL(req.url, 'http://localhost');
	const token = req.headers.authorization?.replace(/^Bearer /, '');
	for await (const chunk of req) {
		void chunk;
	}
	const send = (data, status = 200) => {
		res.writeHead(status, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify(data));
	};
	if (url.pathname === '/auth/v1/token') {
		const payload = {
			sub: adminId,
			aud: 'authenticated',
			role: 'authenticated',
			exp: Math.floor(Date.now() / 1000) + 3600,
			iat: Math.floor(Date.now() / 1000),
			jti: String(++sequence)
		};
		const access_token = [{ alg: 'HS256', typ: 'JWT' }, payload, 'test-signature']
			.map((part) => Buffer.from(JSON.stringify(part)).toString('base64url'))
			.join('.');
		return send({
			access_token,
			token_type: 'bearer',
			expires_in: 3600,
			refresh_token: 'local-refresh',
			user
		});
	}
	if (url.pathname === '/auth/v1/user')
		return token && !revoked.has(token) ? send(user) : send({ message: 'Signed out' }, 401);
	if (url.pathname === '/auth/v1/logout') {
		revoked.add(token);
		signOuts++;
		res.writeHead(204);
		return res.end();
	}
	if (url.pathname === '/rest/v1/admin_profiles')
		return send({ id: adminId, display_name: 'Admin' });
	if (req.method === 'HEAD') {
		res.writeHead(200, { 'Content-Range': '*/0' });
		return res.end();
	}
	return send([]);
});

await new Promise((resolve) => backend.listen(0, '127.0.0.1', resolve));
const env = {
	...process.env,
	LOCAL_ADMIN_DEMO: 'false',
	PUBLIC_SUPABASE_URL: `http://127.0.0.1:${backend.address().port}`,
	PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'local-logout-test-key'
};
let app;
let browser;
let output = '';
try {
	const build = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], { env });
	build.stdout.on('data', (chunk) => {
		output += chunk;
	});
	build.stderr.on('data', (chunk) => {
		output += chunk;
	});
	assert.equal(await new Promise((resolve) => build.on('exit', resolve)), 0, output);
	const port = 5193;
	const origin = `http://127.0.0.1:${port}`;
	app = spawn(
		process.execPath,
		[
			'node_modules/vite/bin/vite.js',
			'preview',
			'--host',
			'127.0.0.1',
			'--port',
			String(port),
			'--strictPort'
		],
		{ env }
	);
	app.stdout.on('data', (chunk) => {
		output += chunk;
	});
	app.stderr.on('data', (chunk) => {
		output += chunk;
	});
	let startupStatus = '';
	for (let attempt = 0; ; attempt++) {
		try {
			const response = await fetch(origin + '/admin/login');
			if (response.ok) break;
			startupStatus = `${response.status()} ${await response.text()}`;
		} catch (error) {
			startupStatus = String(error.cause || error);
		}
		if (attempt >= 60 || app.exitCode !== null)
			throw new Error('Preview failed: ' + startupStatus + output.slice(-2000));
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	browser = await chromium.launch({ headless: true });
	for (const javaScriptEnabled of [true, false]) {
		const context = await browser.newContext({ javaScriptEnabled });
		const page = await context.newPage();
		await page.goto(origin + '/admin/login');
		await page.getByLabel('Email address').fill(user.email);
		await page.getByLabel('Password', { exact: true }).fill('test-password');
		await page.getByRole('button', { name: 'Sign in', exact: true }).click();
		await page.waitForURL('**/admin/dashboard');
		// Reload so the document receives the admin response headers, as it does in production.
		await page.reload();
		assert((await context.cookies()).some((cookie) => cookie.name.includes('auth-token')));

		// Both opaque and foreign origins must stay blocked without clearing the session.
		for (const requestOrigin of ['null', 'https://untrusted.example']) {
			const blocked = await context.request.post(origin + '/admin/logout', {
				headers: { origin: requestOrigin },
				form: {}
			});
			assert.equal(blocked.status(), 403);
		}
		const requestPromise = page.waitForRequest(
			(request) => request.url().endsWith('/admin/logout') && request.method() === 'POST'
		);
		const responsePromise = page.waitForResponse(
			(response) =>
				response.url().endsWith('/admin/logout') && response.request().method() === 'POST'
		);
		await page.getByRole('button', { name: 'Sign out', exact: true }).click();
		const request = await requestPromise;
		const response = await responsePromise;
		const requestOrigin = (await request.allHeaders()).origin;
		console.log(
			JSON.stringify({
				javaScriptEnabled,
				logoutOrigin: requestOrigin,
				logoutStatus: response.status()
			})
		);
		assert.equal(requestOrigin, origin, 'Native logout form must preserve the Origin header');
		assert.equal(response.status(), 303);
		await page.waitForURL('**/admin/login');
		assert.equal(
			(await context.cookies()).some((cookie) => cookie.name.includes('auth-token')),
			false,
			'Session cookie must be removed'
		);
		assert.equal((await context.request.get(origin + '/api/site-content')).status(), 401);
		await page.goBack();
		await page.waitForURL('**/admin/login**');
		await page.reload();
		await page.waitForURL('**/admin/login**');
		await page.goto(origin + '/admin/dashboard');
		await page.waitForURL('**/admin/login**');
		await context.close();
	}
	assert.equal(signOuts, 2);
	console.log(
		'PASS: production logout, cookie deletion, protected API, Back/refresh, and CSRF checks with and without JavaScript.'
	);
} finally {
	await browser?.close();
	app?.kill();
	await new Promise((resolve) => backend.close(resolve));
}

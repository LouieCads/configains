import assert from 'node:assert/strict';

export async function checkRecovery({ page, context, browser, origin, recovery, failures }) {
	const requestReset = async (email) => {
		await page.goto(origin + '/admin/forgot-password');
		await page.getByLabel('Email address', { exact: true }).fill(email);
		await page.getByRole('button', { name: 'Send reset link', exact: true }).click();
		await page.getByRole('status').waitFor();
		return page.getByRole('status').textContent();
	};
	const unknownMessage = await requestReset('unknown@example.test');
	assert.equal(await requestReset('admin@example.test'), unknownMessage);
	const token = recovery.emails.at(-1).token;
	const recoveryContext = await browser.newContext();
	const recoveryPage = await recoveryContext.newPage();
	recoveryPage.on('pageerror', (error) => failures.push(error.message));
	const recoveryUrl = origin + '/admin/recover?token_hash=' + token;
	try {
		const response = await recoveryPage.goto(recoveryUrl);
		assert.equal(response.headers()['cache-control'], 'private, no-store');
		assert.equal(response.headers()['referrer-policy'], 'no-referrer');
		assert.equal(recovery.verifications, 0, 'GET must not consume an email recovery token');
		await recoveryPage.screenshot({
			path: '.audit/screenshots/admin-recovery.png',
			fullPage: true
		});
		await recoveryPage.getByRole('button', { name: 'Continue to reset password' }).click();
		await recoveryPage.waitForURL('**/admin/reset-password');
		assert.equal(recovery.verifications, 1);
		assert(!recoveryPage.url().includes('token_hash'));
		await recoveryPage.getByLabel('New password', { exact: true }).fill('new-configains-password');
		await recoveryPage
			.getByLabel('Confirm new password', { exact: true })
			.fill('mismatched-password');
		await recoveryPage.getByRole('button', { name: 'Update password', exact: true }).click();
		await recoveryPage.getByRole('alert').filter({ hasText: 'do not match' }).waitFor();
		assert.equal(recovery.updates, 0);
		const shortStatus = await recoveryPage.evaluate(
			async () =>
				(
					await fetch('/admin/reset-password', {
						method: 'POST',
						body: new URLSearchParams({ password: 'short', confirmation: 'short' })
					})
				).status
		);
		assert.equal(shortStatus, 400);
		assert.equal(recovery.updates, 0);
		const crossOrigin = await recoveryContext.request.post(origin + '/admin/reset-password', {
			headers: { Origin: 'https://foreign.example' },
			form: { password: 'new-configains-password', confirmation: 'new-configains-password' }
		});
		assert.equal(crossOrigin.status(), 403);
		assert.equal(recovery.updates, 0);
		await recoveryPage.getByLabel('New password', { exact: true }).fill('new-configains-password');
		await recoveryPage
			.getByLabel('Confirm new password', { exact: true })
			.fill('new-configains-password');
		await recoveryPage.getByRole('button', { name: 'Update password', exact: true }).click();
		await recoveryPage.waitForURL('**/admin/login?password=updated');
		assert.equal(recovery.updates, 1);
		assert.equal((await recoveryContext.request.get(origin + '/api/site-content')).status(), 401);
		await recoveryPage.getByLabel('Email').fill('admin@example.test');
		await recoveryPage.getByLabel('Password', { exact: true }).fill('local-test-password');
		await recoveryPage.getByRole('button', { name: 'Sign in' }).click();
		await recoveryPage.getByRole('alert').waitFor();
		await recoveryPage.getByLabel('Password', { exact: true }).fill('new-configains-password');
		await recoveryPage.getByRole('button', { name: 'Sign in' }).click();
		await recoveryPage.waitForURL('**/admin/dashboard');
		await recoveryPage.getByRole('button', { name: 'Sign out' }).click();
		await recoveryPage.waitForURL('**/admin/login');
		for (const candidate of [token, 'x'.repeat(64)]) {
			await recoveryPage.goto(origin + '/admin/recover?token_hash=' + candidate);
			await recoveryPage.getByRole('button', { name: 'Continue to reset password' }).click();
			await recoveryPage
				.getByRole('alert')
				.filter({ hasText: 'expired or has already been used' })
				.waitFor();
		}
		await recoveryPage.goto(origin + '/admin/reset-password');
		await recoveryPage.waitForURL('**/admin/forgot-password?expired=1');
		await requestReset('member@example.test');
		await recoveryPage.goto(origin + '/admin/recover?token_hash=' + recovery.emails.at(-1).token);
		await recoveryPage.getByRole('button', { name: 'Continue to reset password' }).click();
		await recoveryPage.getByRole('alert').filter({ hasText: 'administrator access' }).waitFor();
		assert.equal((await recoveryContext.request.get(origin + '/api/site-content')).status(), 401);
		for (const email of ['limited@example.test', 'smtp-failed@example.test']) {
			await page.goto(origin + '/admin/forgot-password');
			await page.getByLabel('Email address', { exact: true }).fill(email);
			await page.getByRole('button', { name: 'Send reset link' }).click();
			await page.getByRole('alert').waitFor();
		}
		const foreign = await context.request.post(origin + '/admin/forgot-password', {
			headers: { Origin: 'https://foreign.example' },
			form: { email: 'admin@example.test' }
		});
		assert.equal(foreign.status(), 403);
		assert.equal(recovery.updates, 1);
		await recoveryPage.setViewportSize({ width: 320, height: 850 });
		await recoveryPage.goto(origin + '/admin/forgot-password');
		assert.equal(
			await recoveryPage.evaluate(
				() => document.documentElement.scrollWidth > window.innerWidth + 1
			),
			false
		);
		await recoveryPage.screenshot({
			path: '.audit/screenshots/admin-recovery-mobile.png',
			fullPage: true
		});
	} catch (error) {
		console.error(await recoveryPage.locator('body').innerText());
		throw error;
	} finally {
		await recoveryContext.close();
	}
}

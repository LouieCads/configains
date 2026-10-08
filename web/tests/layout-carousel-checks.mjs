import assert from 'node:assert/strict';

export async function checkLayoutAndCarousel({ page, origin }) {
	const api = (method, path, data) =>
		page.evaluate(
			async ({ method, path, data }) => {
				const response = await fetch(path, {
					method,
					headers: { 'Content-Type': 'application/json' },
					...(data ? { body: JSON.stringify(data) } : {})
				});
				return {
					ok: response.ok,
					status: response.status,
					body: response.status === 204 ? null : await response.json()
				};
			},
			{ method, path, data }
		);
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto(origin + '/admin/content');
	await page.getByRole('tab', { name: 'Section order', exact: true }).click();
	const sections = page.locator('.section-order li');
	assert.equal(await sections.count(), 10);
	for (let index = 0; index < 9; index++)
		await page.getByRole('button', { name: 'Move Contact up', exact: true }).click();
	assert.match(await sections.first().innerText(), /Contact/);
	await page.getByRole('button', { name: 'Save draft', exact: true }).first().click();
	await page.getByRole('status').filter({ hasText: 'Draft saved.' }).waitFor();
	const order = (path) =>
		page.evaluate(async (path) => {
			const response = await fetch(path);
			if (!response.ok) throw new Error('Could not load the homepage');
			const document = new DOMParser().parseFromString(await response.text(), 'text/html');
			const contact = document.getElementById('contact-title');
			const hero = document.getElementById('hero-title');
			if (!contact || !hero) throw new Error('Homepage headings are missing from the response');
			return Boolean(contact.compareDocumentPosition(hero) & Node.DOCUMENT_POSITION_FOLLOWING);
		}, path);
	assert.equal(await order('/'), false, 'Reordering a draft does not change the published page');
	assert.equal(await order('/?preview=1'), true, 'Draft preview uses the saved section order');
	await page.reload();
	await page.getByRole('tab', { name: 'Section order', exact: true }).click();
	assert.match(await sections.first().innerText(), /Contact/, 'Order survives reload');
	await page.getByRole('button', { name: 'Publish website', exact: true }).click();
	await page
		.getByRole('dialog', { name: 'Publish your website?' })
		.getByRole('button', { name: 'Publish website' })
		.click();
	await page.getByRole('status').filter({ hasText: 'Published.' }).waitFor();
	assert.equal(await order('/'), true, 'Publishing updates the public section order');

	const ids = [];
	for (let index = 0; index < 9; index++) {
		const response = await api('POST', '/api/cms/transformations', {
			title: `Carousel story ${index + 1}`,
			summary: 'Before and after progress',
			story: 'The full client story.',
			before_image_url: '/og-image.png',
			after_image_url: '/og-image.png',
			before_image_alt: 'Before',
			after_image_alt: 'After',
			sort_order: index,
			is_published: index < 8
		});
		assert.equal(response.ok, true);
		ids.push(response.body.id);
	}
	for (const route of ['/', '/transformations']) {
		await page.goto(origin + route);
		const carousel = page.getByRole('region', { name: 'Client transformations', exact: true });
		assert.equal(
			await carousel.locator('article').count(),
			8,
			'All eight published entries are available'
		);
		assert.equal(
			await page.getByText('Carousel story 9', { exact: true }).count(),
			0,
			'Unpublished entries stay private'
		);
		await carousel.getByRole('button', { name: 'Next transformation' }).click();
		await page.waitForFunction(() => {
			const track = document.querySelector('.transformation-track');
			const step = track.children[1].offsetLeft - track.children[0].offsetLeft;
			return Math.abs(track.scrollLeft - step) < 2;
		});
		await carousel.locator('.transformation-track').evaluate((element) => {
			element.scrollLeft = element.scrollWidth;
		});
		await page.waitForFunction(
			() => document.querySelector('[aria-label="Next transformation"]').disabled
		);
		assert.equal(
			await carousel.getByRole('button', { name: 'Previous transformation' }).isEnabled(),
			true
		);
		assert.equal(
			await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
			false
		);
	}
	await page.screenshot({
		path: '.audit/screenshots/transformation-carousel-desktop.png',
		fullPage: true
	});
	for (const count of [5, 3, 1, 0]) {
		while (ids.length > count + 1) {
			const id = ids.splice(ids.length - 2, 1)[0];
			const response = await api('DELETE', '/api/cms/transformations?id=' + id);
			assert.equal(response.ok, true);
		}
		await page.setViewportSize({ width: 390, height: 850 });
		await page.goto(origin + '/transformations');
		assert.equal(await page.locator('.transformation-track article').count(), count);
		if (count > 1) {
			await page.getByRole('button', { name: 'Next transformation' }).click();
			await page.waitForFunction(() => {
				const track = document.querySelector('.transformation-track');
				const step = track.children[1].offsetLeft - track.children[0].offsetLeft;
				return Math.abs(track.scrollLeft - step) < 2;
			});
		} else assert.equal(await page.getByRole('button', { name: 'Next transformation' }).count(), 0);
		assert.equal(
			await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
			false
		);
		if (count === 3)
			await page.screenshot({
				path: '.audit/screenshots/transformation-carousel-mobile.png',
				fullPage: true
			});
	}
	await api('DELETE', '/api/cms/transformations?id=' + ids[0]);
	await page.goto(origin + '/admin/content');
}

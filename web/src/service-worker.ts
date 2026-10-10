/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />
import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const cacheName = `configains-${version}`;
const precached = new Set([...build, ...files]);

// Only the logging shell is cached for offline use. It is client-rendered and holds no user data;
// the plan and the entries come from IndexedDB or the authenticated API.
const offlineShell = '/app/log';

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(cacheName)
			.then((cache) => cache.addAll([...precached]))
			.then(() => sw.skipWaiting())
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			for (const key of await caches.keys()) if (key !== cacheName) await caches.delete(key);
			await sw.clients.claim();
		})()
	);
});

sw.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);
	if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

	// Built assets never change under the same name, so cache-first is safe.
	if (precached.has(url.pathname)) {
		event.respondWith(caches.match(event.request).then((cached) => cached ?? fetch(event.request)));
		return;
	}

	// Network first for the logging shell, falling back to the cached copy when offline.
	if (event.request.mode === 'navigate' && url.pathname === offlineShell && url.search === '') {
		event.respondWith(
			(async () => {
				const cache = await caches.open(cacheName);
				try {
					const response = await fetch(event.request);
					if (response.ok) void cache.put(event.request, response.clone());
					return response;
				} catch {
					const cached = await cache.match(event.request);
					return cached ?? Response.error();
				}
			})()
		);
	}
});

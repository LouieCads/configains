// Client-rendered on purpose: the page shell holds no user data, so the service worker can cache it
// for offline use. The plan and entries come from IndexedDB or the authenticated API.
export const ssr = false;

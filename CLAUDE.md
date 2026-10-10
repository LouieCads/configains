# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Layout

- `web/`: SvelteKit app (public site, admin CMS, API routes). All app commands run from here.
- `supabase/`: migrations, RLS/policies, `config.toml`, SQL tests (`supabase/tests/website_cms.sql`), maintenance scripts.
- Root `netlify.toml`: Netlify build (base `web`, publish `build`, Node 22, pnpm 10.17.1).
- Git root is this directory; `web/` is not its own repo.

## Commands

Run from `web/` (pnpm 10+, Node 22+, `engine-strict` is on):

- `pnpm install`, `pnpm dev` (http://localhost:5173)
- `pnpm check`: `svelte-kit sync` + svelte-check/TypeScript
- `pnpm lint`: Prettier check + ESLint (`pnpm format` to fix Prettier)
- `pnpm test`: all Vitest projects once. `pnpm test:unit` runs in watch mode.
- Single test file: `pnpm vitest --run src/lib/content/schema.spec.ts` (path filter works; add `-t "name"` for one case)
- Browser specs (`*.svelte.{test,spec}.ts`) need Playwright Chromium. Server specs (`src/**/*.spec.ts`, node env) do not.
- `pnpm build`: production build via `@sveltejs/adapter-netlify`
- E2E scripts (Playwright, need `pnpm build` first for local-demo/logout): `pnpm test:cms`, `pnpm test:local-demo`, `pnpm test:logout`. They write results to the ignored `web/.audit/`. Don't run them alongside a dev server or build.
- `pnpm generate:social`: regenerates `static/og-image.png`.

Supabase schema: apply `supabase/migrations/` in filename order (initial schema, website CMS, upload limits). The SQL in `supabase/tests/website_cms.sql` runs against an isolated Postgres after both CMS migrations.

## Architecture (big picture)

**Content schema drives everything.** `web/src/lib/content/schema.ts` (`websiteSchema`) defines each editable field, its label, kind, and default. That one tree feeds:
- the admin editor (`src/lib/features/cms/`, schema-driven fields and tabs),
- default content for new projects and normalization of stored JSON (`normalizeContent` never throws; unknown keys dropped, bad values reset to defaults),
- server validation (`validateWebsite` runs in both the editor and the API).
Tab placement lives in `features/cms/editor-panels.ts`; `editor-panels.spec.ts` fails when a field has no tab. Collection fields live in `content/collections.ts`, which also sets the API allowlist.

**Two content stores.**
- Website document: one JSON document in `site_content`. Public copy is `key = 'website'`; the admin's private draft is `key = 'website.draft'`. Save writes the draft through the `save_website_draft` RPC. Publish (`publish_website_content` RPC) copies the draft to `website` atomically. `updated_at` is the revision token: writes send the revision the editor last saw, and stale ones get SQLSTATE 40001, which the API returns as 409.
- Collections (testimonials, transformations): table rows, published individually via `is_published`. They skip the draft workflow.

**Public site is server-rendered per request** from the published document (`src/lib/server/website.ts`, `readWebsite`). No rebuild needed for content changes. If the DB is unreachable, pages fall back to `defaultWebsite()`. Legacy canonical origins in stored documents are rewritten to the current default. `sitemap.xml`, `robots.txt`, `llms.txt` and the per-page SEO data also read published content.

**Auth and writes.** `hooks.server.ts` builds `event.locals.supabase`: a cookie-based `@supabase/ssr` client, or the demo client. `safeGetUser()` verifies the user with Auth once per request. Every write endpoint calls `requireSameOrigin` (CSRF on Origin) and `requireAdmin` (user must have a row in `public.admin_profiles`). Admin pages redirect to `/admin/login`; `/api/*` returns 401/403. RLS in Postgres is the final authority; the app checks are a first layer, not the security boundary. Admin and API responses set `no-store`, `noindex`, and `Referrer-Policy: same-origin`, so do not change that header for native POST forms without checking CSRF.

**Local demo mode.** `LOCAL_ADMIN_DEMO=true` (Vite dev only, loopback host and client only) swaps in `createDemoClient` (`src/lib/server/local-demo.ts`), a file-backed Supabase stand-in writing to the ignored `web/.local-cms/`. No Supabase calls happen in this mode. The policy check lives in `local-demo-policy.ts` and is unit-tested.

**Uploads.** Browser crops images to WebP at most 4 MB (`features/cms/ImageCropper.svelte`, limits in `content/uploads.ts`), then `POST /api/uploads` writes to Supabase Storage. Uploaded files are never overwritten or deleted. In local demo, `/api/local-media/` serves files from disk.

**Coaching assessment form** is Netlify Forms. `web/static/assessment-form.html` exists so Netlify detects the form at deploy time; its field names must match the visible form in `routes/(public)/contact/+page.svelte`. Submissions only work on deployed Netlify, not in dev.

**Project-specific invariants**
- URLs and image paths must pass `isSafeUrl` (same-site paths or credential-free HTTPS).
- Layout, decorative graphics, form field identifiers, and security rules are not CMS-editable by design.
- Do not add an SPA catch-all redirect; the Netlify adapter handles routing.
- Never commit `.env` or a service-role key. Only the publishable key goes into `PUBLIC_SUPABASE_*`.

## Docs status

`README.md` (root) and `web/README.md` are the main references. The root README links to `PRODUCTION_SETUP.md`, `CMS_GUIDE.md`, and `PHASE_1_REVIEW.md`, but none of those files exist in the repo. Don't assume their contents, and ask before recreating them.

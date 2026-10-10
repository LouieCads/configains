# Configains

Configains is a serverless SvelteKit website and custom content-management system backed by Supabase. The SvelteKit app in `web/` contains the public website, admin UI, and serverless endpoints. The `supabase/` directory contains the database, authorization, and storage configuration.

## Prerequisites

- Node.js 22+
- pnpm 10+
- A Supabase project (or the Supabase CLI for local development)

## Start locally

1. Copy `web/.env.example` to `web/.env` and add your Supabase project values.
2. Apply unapplied migrations in chronological order: `20260928000000_initial_schema.sql`, `20261003000000_website_cms.sql`, then `20261004000000_upload_limits.sql` in `supabase/migrations/`. They configure the schema, protected drafts/publishing and image descriptions, and a 4 MB upload limit. Existing content and images are preserved by the later migrations.
3. Create an Auth user, then add that user's UUID to `public.admin_profiles` using the Supabase SQL editor.
4. Run the app:

   ```sh
   cd web
   pnpm install
   pnpm dev
   ```

The public site is available at `http://localhost:5173`; the CMS sign-in is at `/admin/login`. The public website has no admin login link. Cash can bookmark the sign-in URL; authorization is enforced through Supabase Auth, an administrator allowlist, and database policies.

## Admin bootstrap

For a temporary local preview, set `LOCAL_ADMIN_DEMO=true` in `web/.env`, run `pnpm dev`, and open `/admin/login`. **Sign in** opens the CMS without credentials. This mode requires Vite development, a loopback hostname and a loopback client connection. It cannot activate in a production build. Drafts, published demo content and images are isolated in the ignored `web/.local-cms/` directory; no Supabase reads or writes occur in demo mode. Edits persist across server restarts, but you must click Sign in again after a restart. Set the flag to `false` and restart Vite to restore normal Supabase authentication and content.

Admin access intentionally cannot be self-assigned. Create Cash's user in Supabase Auth using his confirmed login email and a private password. Then run this once with that user's actual UUID (do not use the public contact email unless Cash confirms it is his login):

```sql
insert into public.admin_profiles (id, display_name)
values ('AUTH_USER_UUID', 'Site administrator');
```

The login page includes password recovery. Configure Supabase email delivery and the Site URL using [the production setup guide](PRODUCTION_SETUP.md). The default Supabase reset email works; a branded template is optional. The recovery screens verify the link and administrator access before allowing a new password. Never put a password or service-role key in the repository. No account has been created or production migration applied by this change.

## Content studio

See [the admin guide](CMS_GUIDE.md) for the editing workflow. `/admin/content` edits all public copy, headings, navigation labels and destinations, brand/contact settings, photos, services, product previews, app readiness/link, assessment labels and options, FAQs, and each page's search/sharing metadata. Lists can be added, removed and reordered; approved images can be uploaded without code changes. Layout, decorative graphics, form field identifiers and security rules remain part of the application.

**Save draft → Preview saved draft → Publish website.** Drafts are private and preview requires an admin session. Saving does not change the public site. Publishing atomically copies the saved draft into the published `website` document. Stale revisions return 409 instead of overwriting another editing session. Unsaved edits trigger a navigation warning and can be discarded. Image uploads must finish before saving/publishing.

Testimonials and transformations have separate editors with image descriptions, publication switches, sorting, and deletion. These collections publish individually when their **Published** checkbox is enabled; they do not share the website draft workflow. The sample seeded testimonial remains unpublished. Obtain client permission before publishing any story or image.

The public pages are rendered on the server from the published document on each request, with schema defaults for a new project. No rebuild is needed for routine content updates. If the database cannot be reached, the public site uses its default content and the editor reports the connection problem; investigate the database before publishing. Existing unrelated `site_content` rows are preserved and are not used as the website document.

## SEO and answer content

The implementation follows the reference Personal Website's structure: a shared SEO component, page metadata, entity structured data, a sitemap, robots rules, and `llms.txt`. It uses only Configains/Cash Fuerte copy and the existing landing theme.

- Public canonical origin: `https://configains.fundrstudio.com`, editable under **Brand and contact**. `configains.app` stays a separate app destination.
- All five public pages have server-rendered titles, descriptions, canonical links, Open Graph/Twitter metadata and meaningful headings. A Configains favicon and 1200×630 social image are included; either can be replaced in the CMS.
- JSON-LD describes Configains, Cash Fuerte, the website and pages, inner-page breadcrumbs, and coaching services. Home-page FAQ data uses the same questions and answers as the visible section; disabling the section removes its FAQ schema. No ratings, client endorsements, addresses or credentials are fabricated.
- `/sitemap.xml`, `/robots.txt` and `/llms.txt` read published CMS content. Publication updates answer content and search metadata alongside the pages. Draft previews, admin pages, APIs and the confirmation page are excluded from indexing.

These additions support crawling and understandable answers; they do not promise rankings, AI citations, or FAQ rich results. Follow [Google's AI search guidance](https://developers.google.com/search/docs/appearance/ai-features) and [structured-data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

## Deployment

Follow [the production setup guide](PRODUCTION_SETUP.md) for the ordered Supabase, recovery-email, Netlify, DNS and live verification steps.

Deploy the repository through Netlify's Git integration. The root `netlify.toml` configures:

- Base directory: `web`
- Build command: `pnpm build`
- Publish directory: `build` (relative to `web`)
- Node.js: `22`
- pnpm: `10.17.1`

Leave the package directory and functions directory unset; the SvelteKit Netlify adapter generates the server function and routing automatically. Do not add an SPA catch-all redirect to `index.html`.

Before the first deploy, add `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Netlify's environment variable settings, using your Supabase project values from `web/.env`. Make them available during builds for production and any deploy previews you enable. These variables are imported through SvelteKit's static environment module, so changing them requires rebuilding the site. Use the publishable key for `PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Client invitations also need `SUPABASE_SERVICE_ROLE_KEY`, which is a server-only secret: add it in Netlify's secret environment variables, never give it a `PUBLIC_` prefix, and do not commit `.env`.

AI Coaching needs `AI_API_KEY` (Gemini) as a server-only Netlify secret. Without it, clients still get a program from rules-only matching. Set `AI_MODEL` to the current Flash-Lite model ID once confirmed. Clients may submit at most three assessments per day.

Add `configains.fundrstudio.com` in Netlify's domain settings, configure the DNS record supplied by Netlify at the Studio DNS provider, and wait for HTTPS provisioning. Verify that the domain resolves before checking live routes and canonical URLs. The earlier DNS review covered a different domain and does not establish this domain's status.

Supabase continues to host PostgreSQL, Auth, and Storage. The existing database migration and admin bootstrap are still required for CMS functionality. Netlify hosts the entire existing SvelteKit app, including its admin and API routes, while the root route displays the landing page.

Commit and push the adapter, lockfile, and configuration changes before triggering the Netlify deployment. A local `pnpm build` validates the Netlify output; the first hosted deployment should also be checked for the home page, admin login, and static assets.

## Coaching assessment and email delivery

Coaching inquiry buttons lead to `/contact`, the fitness and nutrition assessment. Cash Fuerte is presented as Configains' founder and coach, and personally reviews responses before recommending a program, plan, and duration.

The form uses Netlify Forms. The static definition at `web/static/assessment-form.html` lets Netlify detect the form during deployment; its field names must match the visible form in `web/src/routes/(public)/contact/+page.svelte`. Submissions are URL-encoded and sent to the static form endpoint. A honeypot helps filter spam. The submitter's `email` field supplies the notification's Reply-To address.

**Email delivery requires this one-time Netlify setup; committing the code alone does not configure notifications:**

1. Enable form detection in the Netlify site's Forms settings, then deploy the updated site.
2. Confirm `coaching-assessment` appears in the site's active forms.
3. Open **Forms → Submission notifications → Add notification → Email notification**. Select `coaching-assessment` and set the recipient to **configains@gmail.com**. Suggested subject: `New Configains coaching assessment`.
4. Submit an explicitly authorized test on the deployed site and verify that all answers reach the inbox and that Reply-To points to the submitter. Check Netlify's spam submissions if a test does not appear.

Local Vite development intentionally reports that delivery is unavailable and keeps answers intact. Netlify processes submissions only on its deployed service. Network or service errors also preserve answers for a retry. No assessment data is stored in browser local storage or written to application logs.

See [Netlify Forms setup](https://docs.netlify.com/manage/forms/setup/) and [email notification configuration](https://docs.netlify.com/manage/forms/notifications/).

## Commands

From `web/`:

- `pnpm dev`: development server
- `pnpm check`: Svelte and TypeScript validation
- `pnpm lint`: formatting and lint checks
- `pnpm test`: unit tests
- `pnpm test:cms`: full browser flow against a local Supabase-compatible fixture; no production writes or email delivery
- `pnpm test:local-demo`: one-click localhost entry, isolated persistent editing/uploads, and production authentication checks (run `pnpm build` first)
- `pnpm test:logout`: builds and tests production logout in Chromium with and without JavaScript, including cookie removal, Back/refresh, and CSRF rejection against a local Auth fixture
- `pnpm build`: production build
- `pnpm generate:social`: regenerate the 1200 × 630 sharing image from the landing palette and bundled Bebas Neue font

The browser test covers responsive public pages, hidden admin navigation, nonadmin rejection, draft isolation, authenticated preview, publication, uploads, conflict/CSRF checks, individual story publication and deletion, SEO/AEO updates, and logout. It saves local screenshots/results under the ignored `web/.audit/` directory. Chromium must be available to Playwright. Run it separately from builds or SvelteKit sync commands to avoid development-server reloads interrupting form actions.

The logout test produces a build using local fixture credentials. Run `pnpm build` again before previewing or deploying that build with your actual environment. Admin responses use `Referrer-Policy: same-origin`; `no-referrer` makes native logout forms send `Origin: null`, which correctly fails CSRF validation.

`supabase/tests/website_cms.sql` verifies draft privacy, admin-only writes, stale revisions, and publication isolation against real PostgreSQL policies/functions. Run it after both migrations in an isolated local test database, with an owner capable of setting the `anon`/`authenticated` roles. It rolls back its fixtures; it is not a production migration.

See [the Phase 1 review](PHASE_1_REVIEW.md) for verified implementation status and outstanding launch/client items. The user confirmed retaining the existing SvelteKit/Tailwind stack in place of the document's React/Tailwind wording.

# Configains

Configains is a serverless SvelteKit website and custom content-management system backed by Supabase. The SvelteKit app in `web/` contains the public website, admin UI, and serverless endpoints. The `supabase/` directory contains the database, authorization, and storage configuration.

## Prerequisites

- Node.js 22+
- pnpm 10+
- A Supabase project (or the Supabase CLI for local development)

## Start locally

1. Copy `web/.env.example` to `web/.env` and add your Supabase project values.
2. Apply the SQL migration in `supabase/migrations/20260928000000_initial_schema.sql` to your Supabase project.
3. Create an Auth user, then add that user's UUID to `public.admin_profiles` using the Supabase SQL editor.
4. Run the app:

   ```sh
   cd web
   pnpm install
   pnpm dev
   ```

The public site is available at `http://localhost:5173`; the CMS sign-in is at `/admin/login`.

## Admin bootstrap

Admin access intentionally cannot be self-assigned. After creating a user in Supabase Auth, run this once with that user's UUID:

```sql
insert into public.admin_profiles (id, display_name)
values ('AUTH_USER_UUID', 'Site administrator');
```

## Deployment

Deploy the repository through Netlify's Git integration. The root `netlify.toml` configures:

- Base directory: `web`
- Build command: `pnpm build`
- Publish directory: `build` (relative to `web`)
- Node.js: `22`
- pnpm: `10.17.1`

Leave the package directory and functions directory unset; the SvelteKit Netlify adapter generates the server function and routing automatically. Do not add an SPA catch-all redirect to `index.html`.

Before the first deploy, add `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Netlify's environment variable settings, using your Supabase project values from `web/.env`. Make them available during builds for production and any deploy previews you enable. These variables are imported through SvelteKit's static environment module, so changing them requires rebuilding the site. Use the publishable key, never a service-role key, and do not commit `.env`.

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

- `pnpm dev` — development server
- `pnpm check` — Svelte and TypeScript validation
- `pnpm lint` — formatting and lint checks
- `pnpm test` — unit tests
- `pnpm build` — production build

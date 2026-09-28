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

Deploy `web/` as the Vercel project root and configure the two values from `web/.env.example`. Supabase hosts PostgreSQL, Auth, and Storage separately; no standalone backend service is required.

## Commands

From `web/`:

- `pnpm dev` — development server
- `pnpm check` — Svelte and TypeScript validation
- `pnpm lint` — formatting and lint checks
- `pnpm test` — unit tests
- `pnpm build` — production build


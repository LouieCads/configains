# Configains web app

SvelteKit app serving the public website, the admin content studio, and its API. Setup, deployment, and the admin bootstrap live in the [root README](../README.md); the editing workflow for Cash is in [CMS_GUIDE.md](../CMS_GUIDE.md).

## Commands

```sh
pnpm dev              # dev server on http://localhost:5173
pnpm check            # svelte-check + TypeScript
pnpm lint             # Prettier + ESLint
pnpm test             # unit tests (Vitest)
pnpm test:cms         # end-to-end CMS run against a mock Supabase (Playwright)
pnpm test:local-demo  # end-to-end run of the local admin demo
pnpm build
```

## Content management

The CMS manages two kinds of content.

**The website document.** All page copy, navigation, brand settings, FAQs, and SEO metadata live in one JSON document in `site_content`. Admins edit a private draft (`key = 'website.draft'`) and publish it to `key = 'website'` in one step. `updated_at` is the revision token: saves and publishes send the revision the editor last saw, and the database rejects stale ones (409) instead of overwriting another session.

**Item collections.** Testimonials and transformations are table rows that publish individually through `is_published`. They skip the draft workflow.

### Where things live

| Path                                            | Responsibility                                                                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `src/lib/content/schema.ts`                     | `websiteSchema`: every editable field, its label, and default. Also normalization and validation. |
| `src/lib/content/collections.ts`                | Collection fields: drives both the admin forms and the API allowlist.                             |
| `src/lib/content/home-sections.ts`              | Homepage sections and their reorderable order.                                                    |
| `src/lib/content/uploads.ts`, `image-guides.ts` | Upload limits, buckets, and recommended image sizes.                                              |
| `src/lib/features/cms/`                         | Admin UI: schema-driven fields, tabs, collection editors, cropper, dialogs, navigation guard.     |
| `src/lib/features/cms/editor-panels.ts`         | Which fields appear on which editor tab.                                                          |
| `src/lib/server/website.ts`                     | Reads the published or draft document, normalized to the current schema.                          |
| `src/routes/api/site-content`                   | Save draft (PUT) and publish (POST).                                                              |
| `src/routes/api/cms/[collection]`               | Collection CRUD.                                                                                  |
| `src/routes/api/uploads`                        | Image uploads to Supabase Storage.                                                                |
| `src/lib/server/local-demo.ts`                  | File-backed Supabase stand-in for `LOCAL_ADMIN_DEMO=true`.                                        |

Every write endpoint calls `requireSameOrigin` (CSRF) and `requireAdmin`. Database row-level security is still the final authority.

### Common changes

**Add website copy.** Add a field to `websiteSchema` with its default and render it from `content` in the page. The editor shows it automatically. To place it on a specific tab, add its path to `editor-panels.ts`; until then it appears under "Other settings" (and `editor-panels.spec.ts` fails as a reminder). Existing documents pick up the default when loaded, so no migration is needed.

**Add a homepage section.** Add it to `homeSections` and render it in `routes/(public)/+page.svelte`. Saved orders gain the new section at the end.

**Add a collection column.** Add a migration, then add the column to `collections.ts`. The form, the API allowlist, and validation all follow. Update `types/cms.ts` if public pages read it.

**Add a validation rule.** Structural checks (types, lengths, URLs) come from the schema. Content rules the public site depends on go in `validateWebsite`. The editor and the server both run it.

### Invariants

- URLs and image paths must pass `isSafeUrl`: same-site paths or credential-free HTTPS only.
- `normalizeContent` never throws. Unknown keys are dropped; invalid values fall back to defaults.
- Images are cropped in the browser and uploaded as WebP of at most 4 MB. Source files stay local.
- Uploaded files are never overwritten or deleted, so content that still references them keeps working.

## Client area

Clients sign in at `/login` (the public header and footer link to it as **Client sign in**) and use `/app`.

**Targets.** The coach sets per-client targets on the client page in the admin: daily steps, cardio (minutes, sessions a week, heart-rate range, instructions), and nutrition (calories, protein, fat, carbs, reminders). They live in `client_targets`, one row per client, and every field is optional. Targets are validated in `lib/coaching/targets.ts`; the limits there match the table's check constraints.

**Logging.** `/app/log` queues entries in the offline outbox (`lib/coaching/sync.ts`): workouts, measurements, steps and cardio. Rows are insert-only. A second step count for the same day is a correction: the newest entry wins when read (`dailySteps` in `lib/coaching/dashboard.ts`).

**Dashboard.** `/app/progress` and the coach's `/admin/clients/[id]/progress` render `features/progress/ProgressDashboard.svelte`. The numbers come from pure functions in `lib/coaching/dashboard.ts` (this week against targets, streaks, a four-week review, weight and waist trends, strength). Strength is an estimated one-rep max (Epley) from logged load and reps, so the same weight for more reps counts as stronger. Weight direction is never coloured good or bad: that depends on the client's goal.

**Sign-in and invitations.** An invitation link works once. A client who opens it again (or whose link expired) is led to sign in rather than asked for a new password. A client who is already signed in is told so and the link is left unused. `/forgot-password` emails a reset link; reset emails land on `/admin/recover`, which sends an admin to the admin reset screen and a client to `/account/reset-password`. An expired link and a used one fail the same way, so the screen offers both next steps (sign in, or ask Cash for a new invite). The invite and reset emails are `supabase/templates/invite.html` and `recovery.html`; the template that sends is the one saved in the Supabase dashboard, so paste changes there too (see `supabase/config.toml`). Set **Email OTP expiration** to 86400 so invitations last a day.

# Configains production setup

The application is configured for Netlify with Supabase Auth, PostgreSQL, and Storage. Complete these account settings before the live handover. Local demo content is separate from Supabase and is not deployed automatically.

## 1. Apply the database migrations

In the hosted Supabase project's SQL editor, run only the migrations that have not already been applied, in this order:

1. `supabase/migrations/20260928000000_initial_schema.sql`
2. `supabase/migrations/20261003000000_website_cms.sql`
3. `supabase/migrations/20261004000000_upload_limits.sql`

The latest migration changes the `site`, `testimonials`, and `transformations` buckets to a 4 MB upload limit. Existing images are retained. Both the editor and API enforce that limit to leave room for multipart overhead within Netlify's request limit.

If the project already has data, take a backup before changing its schema. Do not rerun the initial migration or reset the production database. In Supabase Storage, confirm all three buckets exist with a 4 MB maximum and the image MIME types configured by the migrations.

## 2. Create Cash's administrator account

In Supabase Authentication, create a user with Cash's confirmed login email and a private password. Use at least 12 characters. Copy that user's UUID and run:

```sql
insert into public.admin_profiles (id, display_name)
values ('REPLACE_WITH_AUTH_USER_UUID', 'Cash Fuerte')
on conflict (id) do update set display_name = excluded.display_name;
```

Keep public sign-ups disabled in the hosted project's Auth settings. Local `supabase/config.toml` settings do not automatically configure your hosted project. Share credentials privately with Cash, who can then choose a new password using recovery. Do not put passwords or a service-role key in Netlify's public variables or the repository.

## 3. Configure Netlify

Import this repository through Netlify's Git integration. The root `netlify.toml` already defines:

| Setting | Value |
| --- | --- |
| Base directory | `web` |
| Build command | `pnpm build` |
| Publish directory | `build` relative to `web` |
| Node.js | `22` |
| pnpm | `10.17.1` |

Leave the functions and package directories unset so the SvelteKit adapter manages the output. Add these build environment variables with values from your hosted Supabase project's connection settings:

```text
PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
LOCAL_ADMIN_DEMO=false
```

Changing either public Supabase variable requires a rebuild. Use a separate Supabase project for deploy previews if you want to edit preview content without modifying production. Production builds require real authentication even if the demo flag is accidentally set to true.

Push the completed source, lockfile, configuration and migrations to the connected repository, then deploy. This guide does not apply database migrations automatically.

## 4. Connect the domain

Add `configains.fundrstudio.com` to Netlify's domain settings. At the DNS provider for `fundrstudio.com`, create the record Netlify specifies for `configains`. Wait for domain verification and HTTPS provisioning. The final site address is:

`https://configains.fundrstudio.com`

Set the CMS **Public website URL** to that address under **Brand and contact**, then publish if the site already has saved content from the former domain. This setting controls canonical links and the sitemap; changing the code default alone does not replace saved CMS content. `configains.app` remains the separate app destination. Verify the domain resolves before testing recovery links and assessment delivery.

## 5. Enable password recovery email

In Supabase Authentication URL Configuration:

- Set **Site URL** to `https://configains.fundrstudio.com` without a trailing slash.
- Add `https://configains.fundrstudio.com/admin/recover` to the redirect allowlist.
- If you intentionally test a separate environment, configure that project's Site URL and exact redirect URL for that environment.

The standard **Reset password** subject and body can remain unchanged. The app accepts Supabase's default recovery redirect. Request the email and open its link in the same browser so the one-time code can use the verifier cookie created with the request. The **Continue to reset password** button exchanges the code and checks the administrator allowlist before opening the password form. Expired or already used links require a new email.

For production delivery, select **Set up SMTP** under **Authentication > Emails > SMTP Settings**. Enter the SMTP host, port, username, password, and verified sender address from your email provider; add that provider's DNS authentication records. Supabase's default email service is restricted to authorized team addresses and is not a production delivery setup. Keep SMTP credentials in Supabase, not the client application. Disable email-provider click tracking for authentication links.

For the SMTP form, use a verified address on your sending domain for **Sender email address** (for example, `no-reply@fundrstudio.com` only if your provider has verified it), **Configains** for **Sender name**, and the provider's exact values for **Host**, **Port number**, **Username**, and **Password**. The default **Minimum interval per user** of 60 seconds can remain. A public Gmail inbox address such as `configains@gmail.com` is the assessment notification recipient, not automatically a verified SMTP sender.

If you choose to brand the reset email after enabling custom SMTP, set the subject to `Reset your Configains admin password` and replace the body with the full contents of `supabase/templates/recovery.html`. That optional template uses a one-time `token_hash` link and also works when the email opens in a different browser. The local CLI configuration now uses Supabase's default template.

The admin clicks **Forgot your password?**, requests an email, opens its link, selects **Continue to reset password**, and enters matching passwords of 12 to 128 characters. A successful update signs out the current session and returns to sign-in. Unknown email addresses receive the same acknowledgement as known accounts.

## 6. Enable assessment notifications

In Netlify, enable form detection and deploy. Confirm that `coaching-assessment` appears under Forms. Add an email submission notification for that form to `configains@gmail.com`.

This notification service is separate from Supabase password recovery email. Changing the public email in the CMS does not change Netlify's notification recipient.

## 7. Verify the hosted site before handover

Use your own approved account and test information:

- Open all public pages, `/sitemap.xml`, `/robots.txt`, and `/llms.txt`.
- Confirm `/admin/login` asks for credentials and a private browser cannot open `/admin/content` or `/api/site-content`.
- Sign in as Cash, save a draft, preview it, publish it, and confirm public content updates.
- Upload an approved image below 4 MB. Confirm a larger image is rejected clearly.
- Edit a testimonial or transformation, try leaving, and choose Cancel. Confirm the text stays. Save the item and confirm navigation no longer warns for that item.
- Request a reset email from the login page. Check actual inbox delivery, complete the reset, and sign in using the new password. Confirm a used link cannot be reused.
- Submit an approved coaching assessment. Verify the submission in Netlify, all answers in the notification inbox, and the submitter's Reply-To address.
- Upload Cash's approved portrait and confirm the final text and assets with him. Social Proof may remain a placeholder.

Local tests use a simulated Auth/Storage service or isolated local demo data. SMTP delivery, DNS/HTTPS, hosted database policies, and Netlify Forms require these real account checks.

References: [Netlify function limits](https://docs.netlify.com/build/functions/configuration/#default-values), [Supabase email templates](https://supabase.com/docs/guides/auth/auth-email-templates), [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

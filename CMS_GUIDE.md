# Configains content studio

Cash can bookmark `https://configains.fundrstudio.com/admin/login` once the site is deployed. There is no login button on the public website. The developer must create Cash's Supabase Auth account and grant its user ID administrator access before first sign-in.

For the temporary local demo, run `pnpm dev` with `LOCAL_ADMIN_DEMO=true` in `web/.env`, open `http://localhost:5173/admin/login`, and click **Sign in** without credentials. Edits and uploaded images stay in `web/.local-cms/` and survive restarting the server. Set `LOCAL_ADMIN_DEMO=false` and restart Vite to use normal Supabase authentication and content. Production builds always use normal authentication.

## Update the website

If you forget your live-site password, click **Forgot your password?** on the sign-in page. Open Supabase's standard reset email in the same browser, select **Continue to reset password**, choose matching passwords of at least 12 characters, and sign in again. Expired or already used links require a new email. The developer must first configure recovery email delivery as described in `PRODUCTION_SETUP.md`.

1. Sign in and open **Content**.
2. Choose a page or shared content area, then open its section tab. On mobile, use the page selector and swipe the tabs. Open list entries such as FAQs or products to edit them; new entries open automatically. Edit text and labels, upload approved photos, and add/remove/reorder items using their controls. Switching tabs keeps your unsaved edits and remembers the last section you opened on each page.
3. Click **Save draft**. Visitors still see the published content.
4. Open **Preview saved draft** to review your edits. Only signed-in administrators can access the preview.
5. Click **Publish website** and confirm. Your pages, search/sharing metadata, FAQs, sitemap and answer content update together.

**Discard unsaved edits** restores your last saved draft. A warning appears if you leave with unsaved edits. If another browser/session changes the draft, reload and review that version before saving again. Finish image uploads before saving or publishing.

## Find the right setting

| Section | What you can change |
| --- | --- |
| Brand and contact | Brand name, coach bio/photo, logo/icon, contact email, public website URL, default sharing image, social profiles |
| Navigation and footer | Navigation links and labels, contact/app labels, footer text |
| Home page | Headlines/rotating words, hero imagery, brand story, section headings, proof placeholders, product previews, app preview/readiness, contact invitation, homepage SEO |
| Coaching services | Service titles, explanations, benefits, order and icons (`training`, `nutrition`, `support`) |
| About / Coaching / Transformations pages | Page introductions, body copy, calls to action and SEO/sharing settings |
| Questions and answers | Visible FAQ questions/answers, order and visibility; answer markup follows the same content |
| Assessment and contact page | Questions, answer options, instructions, privacy/consent copy, buttons, success/error messages and SEO |

Keep the **Public website URL** as `https://configains.fundrstudio.com` unless the website moves. Use HTTPS links or site paths starting with `/`. Replace the default sharing image with an approved image if needed; write a useful image description alongside it. The app URL is a separate setting under Home page; only mark the app ready when Cash confirms it is available.

The public email is editable. Changing that address does **not** change Netlify's notification recipient: the developer must update the recipient in Netlify Forms settings as well.

## Client stories and transformations

Open **Testimonials** or **Transformations**, add an item, fill its fields, and upload approved images with descriptions. Items start unpublished. Enable **Published** only after receiving permission, then save the item. These editors update individual items immediately; they are separate from the website's draft/publish workflow.

Leaving either editor with unsaved changes or an operation in progress prompts a warning. Choosing Cancel keeps the current edits. Saving an item clears its warning; any other unsaved items still need to be saved. Image uploads allow JPG, PNG, WebP and GIF files up to 4 MB.

Use **Sort order** to set the display order (smaller numbers first). The landing page shows the first three published entries in each collection; the Transformations page shows all published transformation entries. **Delete item** asks for confirmation and removes the entry permanently. Uploaded files are retained in Storage when an entry is deleted so that a shared image is not removed from another page.

Social Proof can remain a placeholder for Phase 1. Cash's own portrait must also be supplied and approved before replacing its current placeholder. No direct code edits are required for either update.

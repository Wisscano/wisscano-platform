# Deployment — connecting the external services

This project was built without network access, so none of the steps below
have been run. This is the exact path to take it live.

## 1. Neon Postgres

1. Create a project at neon.tech, copy the pooled connection string into
   `DATABASE_URL` in `.env` (and in Vercel's environment variables later).
2. `npm run db:generate` — generates SQL migration files from `db/schema/`
   into `db/migrations/`.
3. `npm run db:migrate` — applies them to Neon.
4. `npm run db:seed` — populates brands/categories/services/highlights/
   carousel config/document types/admin user. Safe to re-run (idempotent
   checks on every table).

## 2. Vercel Blob

1. In the Vercel dashboard: Storage → Create → Blob. Copy the
   `BLOB_READ_WRITE_TOKEN` into `.env` / Vercel env vars.
2. No further code changes needed — `lib/storage.ts` already targets Blob.
3. Before going live with real procurement attachments (tenders, BOMs),
   revisit the `access: "public"` setting in `lib/storage.ts` — public
   Blob URLs are guessable-but-unlisted, not access-controlled. For
   confidential documents, switch to Vercel Blob's private/signed-URL flow.

## 3. Auth secret

```bash
openssl rand -base64 32
```
Put the output in `AUTH_SECRET`. This signs admin session JWTs
(`lib/session.ts`). Rotating it logs every admin out.

## 4. GitHub → Vercel

1. Push this repository to GitHub.
2. Import it in Vercel. Framework preset: Next.js (auto-detected).
3. Add all `.env.example` variables as Vercel Environment Variables
   (Production + Preview).
4. Set the production domain to `wisscano.co.ke` in Vercel's Domains tab;
   follow Vercel's DNS instructions (A/CNAME records at your registrar).
5. Every PR gets a Preview Deployment automatically (Vercel default) —
   this satisfies the GitHub → Preview → Production pipeline requirement.

## 5. WhatsApp

Works out of the box as a `wa.me` deep link — no setup required. To
upgrade to the WhatsApp Business/Cloud API (server-initiated messages
instead of a user-clicked link):

1. Set up a Meta for Developers app + WhatsApp Business product.
2. Set `WHATSAPP_CLOUD_API_TOKEN` and `WHATSAPP_CLOUD_API_PHONE_ID`.
3. Implement `CloudApiWhatsAppProvider.send()` in `lib/whatsapp.ts` — the
   interface and message-building logic are already there.

## 6. Email notifications (optional)

Set `RESEND_API_KEY` and `EMAIL_FROM`, then implement
`EmailNotificationProvider.send()` in `lib/notifications.ts` (currently a
stub that logs "not implemented" to `notification_log` without failing
the request).

## 7. First login & password change

After seeding, log in at `/admin/login` with the printed credentials, then
change the password immediately. There is no self-service change-password
flow yet — either update `admin_users.password_hash` directly (hash with
bcrypt, 12 rounds, matching `lib/auth.ts`) or add a small admin action
before launch.

## Pre-launch checklist

- [ ] Rotate the seeded admin password
- [ ] Upload real brand logos / showcase imagery via `/admin/media`
      (currently seeded with no images — homepage falls back to the
      abstract gradient panels / plain wordmark cards)
- [ ] Fill in `company_profile` (used by the document engine once PDF
      generation is wired up)
- [ ] Review `access: "public"` in `lib/storage.ts` before real customers
      upload tender/BOM documents
- [ ] Point `NEXT_PUBLIC_APP_URL` at the real production domain (used in
      all canonical URLs and JSON-LD)
- [ ] Submit `/sitemap.xml` to Google Search Console

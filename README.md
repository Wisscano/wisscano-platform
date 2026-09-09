# Wisscano Technologies — Procurement Platform

Production-ready Next.js source for the Wisscano Technologies international ICT
procurement platform. This is **not** an ecommerce site — there are no
product pages, carts, or checkout. The public site showcases brands,
sourcing capability and services; the core interaction is the **Procurement
Request Bar**, which files a structured request into the database and hands
off to WhatsApp.

## What's implemented vs. scaffolded

This was built in a sandboxed environment with **no network access** — it
has not been `npm install`'d, connected to a live Neon database, or
deployed. Everything below is real, complete source code, but the final
"connect it up" step (§ Deployment) is yours to run.

**Fully implemented:**
- Drizzle schema for every entity in the spec (site settings, markets,
  brands, sourcing categories — grouped by technology domain, services,
  showcase, carousels, highlights, procurement requests + items +
  attachments + status history, customers, suppliers, document engine,
  media with mandatory scan-status gating, audit log, admin users)
- **Mandatory malware-screening gate** (`lib/security-scan.ts` +
  `lib/storage.ts`): every uploaded file is stored to a quarantine path,
  content-scanned (magic-byte vs. declared-MIME verification, embedded
  script/executable signature detection, double-extension/filename
  checks, zip-bomb size guard), and only promoted to "clean"/usable if it
  passes — a scanner error or timeout fails *closed*, never open. The
  procurement submission action independently re-verifies every
  attachment's scan status before persisting or building the WhatsApp
  message, so a request can never hand off an unscanned or rejected file.
  See the file header of `lib/security-scan.ts` for exactly what the
  built-in heuristic scanner does and does not cover, and the documented
  seam for plugging in a real engine (ClamAV / managed API).
- Request text sanitization (`lib/sanitize.ts`) — strips HTML/script
  markup server-side regardless of client input, applied to every
  free-text field before storage or WhatsApp inclusion
- Best-effort rate limiting (`lib/rate-limit.ts`) on uploads and
  submissions, with an explicit note on backing it with Upstash Redis for
  multi-instance production deployments
- Procurement Request Engine: Zod-validated server action (long-form text
  supported — 20,000 char ceiling, not an arbitrarily small limit),
  multi-item requests, assisted procurement (both paths), file uploads
  via Vercel Blob behind the scan gate above
- Bidirectional, draggable, database-driven carousels (brands / what we
  source / services) with independently configurable direction & speed
- CMS-driven Highlights/Announcements strip (internal + external/subdomain
  links, scheduling, priority)
- Ambient animated "Technology Field" canvas background (reduced-motion
  aware, responsive density)
- Grouped "What We Source" taxonomy (Computing, Networking, Servers &
  Infrastructure, Security & Surveillance, etc.) with a `/procurement`
  index page and sibling-in-group internal linking on each detail page
- Full Admin Centre: auth (bcrypt + signed JWT session), brands/categories/
  services/showcase/highlights CRUD, procurement request workflow
  (status pipeline, notes, history), carousel config, site settings, SEO
  gap report, media library (with scan-status badges, quarantined files
  never previewed), markets, customers, suppliers, document types
  — all reading/writing real tables, no mock data
- SEO: dynamic `/brands/[slug]`, `/procurement/[slug]`, `/services/[slug]`
  landing pages, `/procurement` grouped index, JSON-LD (Organization,
  WebSite, Brand, Service, BreadcrumbList, ItemList, FAQPage), dynamic
  sitemap.xml/robots.txt
- Notification abstraction (WhatsApp deep-link today, Cloud API adapter
  stubbed for later; email provider stubbed)
- Factual brand positioning: WISSCANO acronym (Wildcard ICT & IoT Systems,
  Software, Cloud, AI & Network Operations) surfaced from admin-editable
  site settings, not hard-coded; Kenya → East Africa → Africa → Global
  language throughout without fabricated offices, partners, or claims

**Scaffolded, needs finishing before relying on it in production:**
- **The malware scanner is heuristic, not a real AV engine** — this is
  the single most important scaffolded piece. `lib/security-scan.ts` is
  written specifically so a real engine (ClamAV via clamd, or a managed
  API) drops in behind the same `MalwareScanner` interface without
  touching upload/procurement code. Do not launch with only the
  heuristic scanner if real attachment risk is expected.
- Document PDF generation (`documents` schema + admin list views exist;
  the actual PDF render step is not wired — see `lib/documents/` note below)
- Suppliers/customers admin CRUD forms (list views are real; create/edit
  forms follow the same pattern as `components/admin/brand-form.tsx` but
  aren't written yet)
- WhatsApp Business/Cloud API adapter (`lib/whatsapp.ts` has the interface
  and a clear TODO)
- Row-level access control on Vercel Blob for private procurement
  attachments (currently uploaded as `access: "public"` once cleared —
  see `lib/storage.ts`)
- Rate limiting is in-memory (`lib/rate-limit.ts`) — fine for a single
  Node process, not correct across multiple serverless instances until
  backed by Upstash Redis or similar

## Stack

Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS · Drizzle ORM ·
Neon Postgres · Vercel Blob · Zod · bcrypt + jose (JWT sessions)

## Getting started

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, AUTH_SECRET, BLOB_READ_WRITE_TOKEN
npm run db:generate     # generate SQL migrations from db/schema
npm run db:migrate      # apply them to your Neon database
npm run db:seed         # seed brands/categories/services/highlights/admin user
npm run dev
```

The seed script prints the initial admin login (`admin@wisscano.co.ke` /
password from `SEED_ADMIN_PASSWORD` env var, or `ChangeMe123!` if unset).
**Change this password immediately** via a direct database update or by
adding a change-password admin action (not yet built).

## Project structure

```
app/                  Routes (App Router). app/admin/(protected) is the
                       authenticated Admin Centre; app/admin/login is not.
components/            Public-site UI. components/admin/ is admin-only.
db/schema/              Drizzle table definitions, one file per domain.
db/seed.ts               Idempotent seed script — safe to re-run.
lib/                    Server-side services: auth, session, storage,
                       whatsapp, notifications, seo, queries (all public
                       reads funnel through lib/queries.ts).
actions/                Server actions. actions/admin/ requires an admin
                       session (enforced server-side via requireAdmin()).
validation/             Zod schemas — one per entity, shared by actions
                       and forms.
```

## Key architectural decisions

- **WhatsApp is a notification channel, not the system of record.** A
  procurement request is always written to Neon first
  (`actions/procurement.ts`); the WhatsApp deep link is generated after
  and can fail without losing the submission.
- **Carousels are `requestAnimationFrame`-driven, not CSS keyframes.**
  This is what makes them draggable in both directions mid-autoplay while
  still resuming their admin-configured direction/speed — see
  `components/marquee.tsx`.
- **Every admin mutation is authorized server-side** via `requireAdmin()`
  in `lib/auth.ts`, not just hidden in the UI. Middleware only gates page
  navigation for UX.
- **No hard-coded content.** Brands, categories, services, showcase items,
  carousel behaviour, highlights, and site settings are all database rows;
  the seed script populates them with the approved prototype's content so
  the live site initially looks identical to what was reviewed.

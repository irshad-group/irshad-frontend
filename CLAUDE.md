# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**Irshad** — a trilingual (English / Arabic / Kurdish) government services guide. Citizens browse ministries and their directorates, then look up the **procedures** ("how do I renew my passport?") each directorate offers, along with the step-by-step **procedure items**, required documents, and downloadable forms. Staff manage all of that through an authenticated admin section in the same app.

This repo is a **rewrite**. The original system was Laravel + MySQL; the schema lives in `irshad_db.sql` (reference only — it is not used at runtime). The backend is now **PocketBase**.

> **Status: backend applied, app not yet scaffolded.** As of 2026-07-30 the PocketBase
> schema is **live** — all 17 content collections plus the extended `users` auth
> collection, with API rules and a trilingual development dataset. See
> `pocketbase/README.md`, and `pocketbase/schema.json` for the versioned snapshot.
>
> Everything under "Architecture" below still describes the **target** Next.js structure,
> not code that exists — `src/` has not been created. Do not assume a file exists because
> it is named here; check first. The "Data model" section is now accurate, but the live
> schema remains the authority.

## Stack

- **Next.js (App Router)** — React Server Components by default, TypeScript throughout
- **PocketBase** — backend: database, auth, file storage, realtime. Accessed via the `pocketbase` JS SDK
- **next-intl** — routing and translation for `en` / `ar` / `ku`, including RTL
- **Tailwind CSS** — styling
- **Zod** — schema validation shared between forms and PocketBase payloads

Pin exact versions at scaffold time and record them here.

## Commands

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run start        # Serve the production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
```

## Environment

There are **two independent** places PocketBase is configured. Both are gitignored and **must never be committed**.

### 1. `.mcp.json` — Claude Code's access to PocketBase

Configures the `pocketbase` MCP server, letting Claude Code inspect collections, read records, and apply schema changes directly. This is a **developer tool**, not part of the deployed application.

| Variable | Purpose |
|---|---|
| `POCKETBASE_URL` | PocketBase base URL, no trailing slash |
| `POCKETBASE_ADMIN_EMAIL` | Superuser email |
| `POCKETBASE_ADMIN_PASSWORD` | Superuser password |

The server is `pocketbase-mcp-bridge`, a third-party community package — not an official PocketBase release. It is pinned to an exact version in `.mcp.json` so an upstream publish cannot silently change what runs against the production database. Review the diff before bumping it.

### 2. `.env.local` — the application's own config

Copy `.env.example` to `.env.local` and fill it in.

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_PB_URL` | client + server | PocketBase base URL, e.g. `https://pb.example.com`. No trailing slash. |
| `PB_ADMIN_EMAIL` | server only | Superuser email. Used for seeding, migrations, and admin-only server tasks. |
| `PB_ADMIN_PASSWORD` | server only | Superuser password. |

`NEXT_PUBLIC_` variables are inlined into the client bundle — only the URL belongs there. **Never** prefix the admin credentials with `NEXT_PUBLIC_`, never import them into a Client Component, and never use them to serve ordinary user requests: end users authenticate as themselves against the `users` collection, and PocketBase API rules do the authorization.

## Architecture

### Directory layout

```
src/
├── app/
│   └── [locale]/
│       ├── (public)/        # Citizen-facing routes
│       │   ├── page.tsx                     # Home: slider, featured procedures, FAQ
│       │   ├── ministries/[slug]/
│       │   ├── directorates/[slug]/
│       │   ├── procedures/[slug]/           # Procedure + its items, files, reviews
│       │   ├── search/
│       │   ├── faq/, team/, partners/, contact/
│       └── (admin)/admin/   # Authenticated CMS — one route per collection
├── components/
│   ├── ui/                  # Primitives (Button, Dialog, Table, ...)
│   ├── public/              # Public-only composites
│   └── admin/               # Admin-only composites (DataTable, entity forms)
├── lib/
│   ├── pb/
│   │   ├── client.ts        # Browser PocketBase instance
│   │   ├── server.ts        # Per-request server instance (reads auth cookie)
│   │   └── collections.ts   # Typed collection accessors
│   ├── auth.ts              # Session helpers, role checks
│   └── i18n.ts              # Locale config, direction, field-suffix helper
├── types/pb.ts              # Generated PocketBase types
├── messages/                # en.json, ar.json, ku.json (UI strings only)
└── middleware.ts            # Locale negotiation + /admin route guard
```

### PocketBase access

Three rules keep data access predictable:

1. **Never construct a `PocketBase` instance inline.** Use `lib/pb/client.ts` in Client Components and `lib/pb/server.ts` in Server Components, Route Handlers, and Server Actions.
2. **One instance per request on the server.** A PocketBase instance carries auth state; a module-level singleton on the server would leak one user's session into another user's request. `lib/pb/server.ts` creates a fresh instance per request and loads the auth cookie into it.
3. **Authorization lives in PocketBase API rules, not in the UI.** Hiding an admin button is presentation. The list/view/create/update/delete rules on each collection are the actual enforcement, and they must be written assuming a hostile client.

Auth state is persisted in an `httpOnly` cookie so Server Components can read it. Sync the cookie from `pb.authStore.onChange`.

### Public vs. admin

Both live in one app, separated by route group and layout:

- `(public)` — mostly static or revalidated. Content changes rarely; prefer caching with tag-based revalidation over per-request fetches.
- `(admin)` — always dynamic. `middleware.ts` redirects unauthenticated users to the login page; the admin layout additionally checks `role` and returns 404 for non-staff, so the admin surface is not enumerable.

## Data model

Field names below are the **target PocketBase** names. The legacy MySQL names are in `irshad_db.sql`.

### Conventions carried over

- **Translatable fields** use a language suffix: `title_en` / `title_ar` / `title_ku`. Note the rename — legacy MySQL used `_kr` for Kurdish; the new schema uses `_ku` to match the ISO code used in routing. Resolve the right field at read time with a helper (`localized(record, 'title', locale)`), never with hardcoded suffixes scattered through components.
- **Ordering** — legacy `v_order` becomes `sort_order` (number).
- **Timestamps** — PocketBase supplies `created` and `updated`. Drop the legacy `created_at` / `updated_at`.
- **Soft deletes** — legacy `deleted_at` has no PocketBase equivalent. Decide per collection: hard delete where recovery does not matter (contact messages), or an explicit `archived` boolean excluded by the list API rule where it does (procedures, ministries).
- **Relations** replace the legacy integer FKs (`ministry_id` → `ministry` relation). PocketBase IDs are 15-character strings, not integers — any code that assumes numeric IDs is wrong.
- **Files** use PocketBase file fields rather than the legacy stored `path` strings.

### Collections

| Collection | From (MySQL) | Notes |
|---|---|---|
| `users` | `users` | PocketBase **auth** collection. Keep `full_name`, `job_title`, `avatar`. Legacy `profile_id` (0/1/2) becomes `role`: `user` \| `moderator` \| `admin`. Password/token/salt/OAuth columns are all handled by PocketBase — drop them. |
| `ministries` | `ministries` | `krg` (bool) flags Kurdistan Regional Government bodies. `logo` file, `gps_lat`/`gps_lon` as numbers. |
| `directorates` | `directorates` | Relation → `ministries`. Has `working_hours_{en,ar,ku}`. |
| `provinces` | *(missing)* | **The dump references `province_id` but contains no `provinces` table.** This collection must be created and populated from scratch. |
| `directorate_branches` | `directorates_prov` | Provincial branches. Relations → `provinces` (and `directorates`, which the legacy table lacked — confirm the intended link). |
| `procedures` | `proc` | Core entity. Relation → `directorates`, `enabled` bool, `shortname` → `slug` (unique, used in URLs), rich-text descriptions, `publish_date`. |
| `procedure_items` | `proc_items` | Steps within a procedure. Relation → `procedures`. |
| `tags` | `proc_tags` | Normalize: one `tags` collection, plus a multi-relation `tags` field on `procedures`, instead of repeating `tag_val` strings per procedure. |
| `files` | `files` | Downloadable forms/documents attached to procedures and procedure items. |
| `comments` | `comments` | User comments. |
| `reviews` | `reviews` | `review` (1–5 rating) + `review_msg`. |
| `faq` | `faq` | Ordered, translatable Q&A. |
| `slider` | `slider` | Home hero slides: image, link, `sort_order`, `enabled`. |
| `team` | `team` | Staff profiles: portrait, job title, bio, `location`. |
| `partners` | `partners` | Logo, link, `location`. |
| `contact` | `contact` | Inbound contact-form messages. Create-only for the public; readable by staff. |
| `navigation` | `menu` + `drawer` | The two legacy tables have effectively the same shape. Merge into one collection with a `placement` field (`menu` \| `drawer`), self-relation `parent`, and `sort_order`. |
| `settings` | `settings` | Key/value site settings. `no_trans` marks values that are not translated (phone, email). |

**Dropped** — PocketBase provides these natively: `migrations`, `failed_jobs`, `password_resets`, `personal_access_tokens`, `failed_login`.

### The polymorphic-target problem

`comments`, `reviews`, and `files` all use a legacy `dest_type` + `dest_id` pair (`0: Proc, 1: Proc Item, 2: Directorate, 3: Ministry`). **PocketBase has no polymorphic relations.**

Use separate nullable relation fields — `procedure`, `procedure_item`, `directorate`, `ministry` — with exactly one populated per record. This keeps referential integrity, lets `expand` work, and lets API rules reference the parent (e.g. only accept a comment on a published procedure). The alternative — a `target_collection` text field plus a `target_id` text field — is more compact but gives up all three of those, so prefer it only if the target set is expected to keep growing.

## i18n and RTL

- Locales: `en`, `ar`, `ku`. Arabic and Kurdish (Sorani) are **RTL**; English is LTR.
- Locale is the first path segment: `/en/procedures/...`, `/ar/procedures/...`.
- Set `dir` on `<html>` from the active locale in the root layout. Use CSS logical properties (`margin-inline-start`, `padding-inline-end`, `start-0`) rather than physical `left`/`right`, so one stylesheet serves both directions.
- **Two distinct kinds of translation.** UI chrome (button labels, validation messages) lives in `messages/*.json`. Content (procedure titles, FAQ bodies) lives in the suffixed PocketBase fields. Never put content in message files.
- Content is often only partially translated. Every content read needs a fallback chain — requested locale → English → first non-empty — and the admin forms should make it visible which languages are still missing for a record.
- Ship a font with real Arabic and Kurdish coverage, and check that Kurdish-specific letters (ڕ ڵ ۆ ێ گ چ پ ژ) render correctly rather than falling back to a substitute face.

## Code conventions

- **Server Components by default.** Add `'use client'` only for interactivity (forms, dialogs, anything using hooks or browser APIs), and push it to the leaves of the tree rather than the top of a page.
- **TypeScript strict.** Generate types from the live PocketBase schema into `types/pb.ts` and regenerate after every schema change — do not hand-write record types.
- **Mutations go through Server Actions**, validated with Zod before they reach PocketBase. Never trust a client-supplied `role`, `enabled`, or relation ID.
- **Path alias** `@/` → `src/`.
- **Naming** — PascalCase components, camelCase functions, kebab-case route segments, snake_case PocketBase fields (matching the collection schema).
- Prefer direct imports over barrel files.

## Working in this repo

- `irshad_db.sql` is a historical reference. It is a 2022 dump whose non-`migrations` rows are Faker-generated placeholder data ("Consequatur itaque.", `via.placeholder.com` logos) — treat it as a source of *schema* intent only, never as seed data.
- When the schema and this document disagree, the live PocketBase schema wins — then fix this document.
- Keep `CHANGELOG.md` current: add an entry under `## [Unreleased]` for anything user-visible.
- `PLAN.md` tracks the build sequence. Tick items off there as they land.

# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**Irshad** — a trilingual (English / Arabic / Kurdish) government services guide. Citizens browse ministries and their directorates, then look up the **procedures** ("how do I renew my passport?") each directorate offers, along with the step-by-step **procedure items**, required documents, and downloadable forms. Staff manage all of that through an authenticated admin section in the same app.

This repo is a **rewrite**. The original system was Laravel + MySQL; the schema lives in `irshad_db.sql` (reference only — it is not used at runtime). The backend is now **PocketBase**.

> **Status: backend live, admin built, public site intentionally not built.**
> As of 2026-07-30 the PocketBase schema is live (see `pocketbase/README.md`) and the
> Next.js app is scaffolded with the **admin dashboard complete** — see
> `docs/ADMIN.md`.
>
> The `(public)` route group holds a **placeholder only**. The citizen-facing pages are
> waiting on the UI/UX design and must not be grown by accretion; replace the placeholder
> wholesale when the designs land.
>
> Two deviations from what is written below, both forced by Next 16 / current tooling:
> the route guard lives in **`src/proxy.ts`**, not `middleware.ts` (Next 16 renamed the
> convention), and there is no `lib/pb/collections.ts` barrel of "typed collection
> accessors" beyond the thin read helpers actually in that file.

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
│   │   ├── collections.ts   # Typed collection accessors (admin; auth-aware)
│   │   └── queries/public.ts # Anonymous reads for the public portal
│   ├── auth.ts              # Session helpers, role checks
│   └── i18n.ts              # Locale config, direction, field-suffix helper
├── types/pb.ts              # Generated PocketBase types
├── messages/                # en.json, ar.json, ku.json (UI strings only)
└── proxy.ts                 # Locale negotiation + /admin route guard
```

> Next 16 renamed the `middleware` convention to `proxy`. The file is
> `src/proxy.ts`; the hook and matcher semantics are unchanged.

### PocketBase access

Three rules keep data access predictable:

1. **Never construct a `PocketBase` instance inline.** Use `lib/pb/client.ts` in Client Components, `lib/pb/server.ts` in authenticated server code, and `lib/pb/queries/public.ts` on the public portal.
2. **One instance per request on the server.** A PocketBase instance carries auth state; a module-level singleton on the server would leak one user's session into another user's request. `lib/pb/server.ts` creates a fresh instance per request and loads the auth cookie into it.
3. **Authorization lives in PocketBase API rules, not in the UI.** Hiding an admin button is presentation. The list/view/create/update/delete rules on each collection are the actual enforcement, and they must be written assuming a hostile client.

Auth state is persisted in an `httpOnly` cookie so Server Components can read it. Sync the cookie from `pb.authStore.onChange`.

**The public portal never uses `pbServer()`.** It calls `cookies()`, and touching a
dynamic API opts the whole route out of static rendering — quietly turning a
cacheable page into a per-request render. Public pages read through
`lib/pb/queries/public.ts`, which uses an anonymous instance with no cookie and
no session. What comes back is exactly what any visitor can see.

Because the API rules already hide unpublished, archived and disabled records
from an anonymous client, public pages must **not** filter for `enabled` or
`archived` themselves. An empty result means "not public" — call `notFound()`.
This also keeps an archived record indistinguishable from a missing one.

### Public vs. admin

Both live in one app, separated by route group and layout:

- `(public)` — statically rendered where possible, with `export const revalidate = PUBLIC_REVALIDATE` (one hour). Content changes rarely and readers are many and slow-connected, so cached HTML is the largest performance lever available.
- `(admin)` — always dynamic. `proxy.ts` redirects unauthenticated users to the login page; the admin layout additionally checks `role` and returns 404 for non-staff, so the admin surface is not enumerable.

**Watch the build output.** Content routes should print `●` (SSG). A route that
becomes `ƒ` has picked up a per-request dependency — usually `cookies()`, or
`useSearchParams` outside a Suspense boundary — and has lost the caching the
performance budget depends on.

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
- The typeface is **IBM Plex Sans Arabic**, self-hosted by `next/font` in the root layout — one family covering Latin, Arabic and Kurdish Sorani, so mixed-script lines show no seam between two faces. No visitor's browser requests anything from Google.
- Its coverage of the Kurdish letters (ڕ ڵ ۆ ێ گ چ پ ژ ڤ ک ھ ە ی) was verified against the font's character map, and confirmed in-browser by measuring each glyph against a generic fallback. **Re-run that check before changing the typeface.** A family that "supports Arabic" can still miss these, and the browser then substitutes another face for single letters inside a word — which looks broken to a Kurdish reader and completely fine to everyone else, so review will not catch it.
- Arabic script gets more leading than Latin (`1.85` vs `1.6`, set on `[dir='rtl'] body`) and is **never letter-spaced** — Arabic letters join, and spacing them apart breaks the joins.
- Render staff-authored content inside `dir="auto"` so the first strong character decides direction per block. Without it, an English paragraph pasted into an Arabic record puts its punctuation on the wrong side.

## Public portal design system

The portal is a public information service for people completing government
procedures, often on a cheap phone and a weak connection, frequently in a second
language. "Modern" here means legible and quiet, not visually novel.

- **One small system, not per-page composition.** Shared primitives live in `components/ui/primitives.tsx` (`Container`, `Card`, `Badge`, `Prose`, `EmptyState`, `buttonClass`) and are extended, never forked per page.
- **Tokens** are defined in `app/globals.css` under `@theme`: an `ink-*` neutral ramp, `brand-*` built on the deep green `#1b5e4b`, and `--measure-prose` / `--measure-narrow` for reading width. Every text/background pair in use passes WCAG 2.2 AA; `ink-400` is below 4.5:1 on white and is for placeholders and disabled states only, never body text.
- **Colour never carries meaning alone.** Published/archived, KRG/federal and translation status each need a text or shape cue too.
- **Empty is normal, not an error.** A directorate may have no branches, a procedure no forms. Use `EmptyState` and, where one exists, offer a route onward instead of a dead end.
- **Content can be hostile to layout.** Staff paste long unbroken strings; `overflow-wrap: anywhere` is set globally on text elements. Check any new component at 320 px.
- Client components are leaves only. The portal must remain readable and navigable with JavaScript disabled.

## Testing (non-negotiable)

**When a function is finished, it is not done until tests cover it 100%.** Then
the change is exercised end-to-end in a real browser. Only then is it committed.

The order matters — each stage catches what the previous one cannot:

1. **Unit tests, 100% coverage.** `vitest.config.mts` enforces lines, branches,
   functions and statements at 100% over the logic modules it lists; the run
   fails below that. Write the tests alongside the function, not afterwards.
2. **End-to-end in a browser.** `npm run e2e:public` drives the real thing
   against `npm run build && npm run start` — the production output, not the dev
   server. Server Components, pages and layouts are covered here rather than by
   unit tests: mount-and-assert on an RSC proves far less than loading the page.
3. **Commit** once `typecheck`, `lint`, `test:coverage`, `build` and the e2e
   suite are all green.

Two rules that keep this honest:

- **An unreachable branch is dead code, not a coverage exemption.** If a test
  cannot reach it, delete the code — do not lower the threshold. `buildNavTree`
  had a redundant guard exactly like this; removing it took branch coverage from
  96% to 100% and left the function simpler.
- **Only count what is actually tested.** The coverage `include` list names the
  modules under unit test. Widening it to the whole of `src` would let the
  threshold pass while real code sits uncovered. Add new logic modules to that
  list as they are written.

Every e2e assertion runs in **all three languages**. That is not ceremony: the
320 px overflow bug in the header, and a skip link that never became visible,
were both caught this way and neither showed up in English review alone.

## Spec-driven work

This repo uses [Spec Kit](https://github.com/github/spec-kit). Feature specs and
plans live in `specs/<NNN>-<short-name>/`, and `.specify/memory/constitution.md`
holds the principles a plan is checked against. The skills are installed under
`.claude/skills/speckit-*` and appear as `/speckit-*` commands after a restart.

The public portal is specified in `specs/001-public-portal-ui/`. Read `spec.md`
for what is being built and `plan.md` for the phase order before adding a public
route — the phases are sequenced so each one is independently shippable.

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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

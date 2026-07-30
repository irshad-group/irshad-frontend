# PLAN.md

Build plan for the Irshad frontend rewrite (Next.js + PocketBase). Phases are ordered by dependency — each one assumes the previous is done.

**Started:** 2026-07-30
**Current phase:** Phase 4 (Phases 0, 1 and 4 done; Phase 2 partly done; Phase 3 blocked on design)

---

## Phase 0 — Foundation

Nothing runs until this is done.

- [x] Scaffold Next.js with TypeScript, App Router, Tailwind, ESLint
- [x] `.env.example` (committed) and `.gitignore` covering `.env*.local` and `.mcp.json`
- [x] `.mcp.json` — PocketBase MCP server config, pinned version
- [x] Fill in PocketBase URL and admin credentials in `.mcp.json`, then restart Claude Code and confirm the `pocketbase` MCP server connects
- [x] `.env.local` with `NEXT_PUBLIC_PB_URL`, `PB_ADMIN_EMAIL`, `PB_ADMIN_PASSWORD`
- [x] `git init` and initial commit — pushed to `irshad-group/irshad-frontend`; `.mcp.json` and `.env.local` confirmed absent from the remote
- [x] Install and configure the `pocketbase` SDK; add `lib/pb/client.ts` and `lib/pb/server.ts` (per-request instance, cookie-backed auth)
- [x] Verify connectivity against the real PocketBase instance before building anything on top of it
- [x] `npm run typecheck` and `npm run lint` scripts wired up

## Phase 1 — PocketBase schema

The schema is the contract for everything downstream; get it right before writing UI.

- [x] Create collections per the table in `CLAUDE.md` — 17 content collections plus the extended `users`
- [x] **Create the `provinces` collection** — authored from Iraq's 19 governorates, with ISO codes, coordinates and a `krg` flag
- [x] Decide and apply the polymorphic-target approach for `comments`, `reviews`, `files` — separate nullable relation fields, as defaulted
- [x] Merge legacy `menu` + `drawer` into one `navigation` collection with a `placement` field
- [x] Normalize `proc_tags` into a `tags` collection plus a multi-relation on `procedures`
- [x] Map legacy `profile_id` (0/1/2) to a `role` select on `users`
- [x] Decide soft-delete policy per collection — `archived` on ministries, directorates, branches and procedures; hard delete elsewhere
- [x] Write API rules for every collection — public read of published content, staff-only writes, create-only public access for `contact`
- [x] Export the schema to a versioned file in the repo so it is reviewable and reproducible — `pocketbase/schema.json`
- [x] Seed a trilingual development dataset — `pocketbase/seed/`, idempotent
- [x] Verify the rules hold against a hostile client — `pocketbase/seed/verify.mjs`, 34 assertions
- [x] Generate `types/pb.ts` from the live schema — `npm run pb:types`
- [x] Enforce the "exactly one polymorphic target" rule in Zod (`lib/admin/schema.ts`); PocketBase has no CHECK constraint for it

## Phase 2 — i18n and layout

- [x] Configure `next-intl` with `en` / `ar` / `ku` and the `[locale]` route segment
- [x] Root layout sets `dir` and `lang` from the active locale
- [ ] Choose and self-host a font with verified Arabic **and** Kurdish coverage
- [x] `localized(record, field, locale)` helper with the fallback chain (requested → English → first non-empty)
- [ ] Locale switcher that preserves the current path
- [ ] Public shell: header, `navigation`-driven menu, footer, `settings`-driven contact details
- [ ] Audit for physical `left`/`right` CSS and replace with logical properties

## Phase 3 — Public portal

> **Blocked on the UI/UX design.** `(public)` currently holds a placeholder only.
> Replace it wholesale when the designs land rather than growing it.

- [ ] Home — slider, featured/recent procedures, FAQ preview
- [ ] Ministries — index and detail, with the ministry's directorates
- [ ] Directorates — index and detail, with working hours, map location, and offered procedures
- [ ] **Procedures — detail page.** The reason the site exists: description, ordered procedure items, attached downloadable files, tags. Get this right before anything else in this phase.
- [ ] Search — across procedures and directorates, working in all three languages
- [ ] FAQ, Team, Partners pages
- [ ] Contact form — writes to `contact`, with spam protection (create-only rule plus rate limiting)
- [ ] Reviews and comments on procedures — submission plus moderated display
- [ ] SEO — per-locale metadata, `hreflang` alternates, sitemap, structured data for procedures

## Phase 4 — Admin

- [x] Login page and session handling against the `users` collection
- [x] Route guard on `/admin` (as `src/proxy.ts` — Next 16 renamed the convention); layout-level role check returning 404 for non-staff
- [x] Shared `DataTable` — server-side pagination, sort, filter
- [x] Shared form primitives, including a **translation-aware field group** that shows all three languages side by side and flags missing ones
- [x] CRUD: procedures + procedure items (the most complex; build first)
- [x] CRUD: ministries, directorates, provinces, directorate branches
- [x] CRUD: slider, FAQ, team, partners, tags
- [x] Moderation queues for comments and reviews
- [x] Contact message inbox
- [x] Navigation editor with parent/child nesting and `sort_order` — **drag-and-drop not built**
- [x] Settings editor honoring the `no_trans` flag
- [x] User management — role assignment and verification; **invite/deactivate flows not built**

## Phase 5 — Content migration

- [ ] Confirm whether real legacy content exists anywhere. **`irshad_db.sql` contains only Faker placeholder data**, so it cannot be the source — this phase is blocked until a real export is produced or content is authored fresh
- [ ] Write the migration script (legacy IDs → PocketBase IDs, `_kr` → `_ku`, file paths → PocketBase file uploads)
- [ ] Dry-run against a staging PocketBase instance and diff the results
- [ ] Verify Arabic and Kurdish text survives the round trip without mojibake
- [ ] Set up URL redirects from legacy paths if the old site's URLs are already indexed

## Phase 6 — Hardening and launch

- [ ] Accessibility pass — keyboard navigation, focus order, contrast, screen reader labels in all three languages
- [ ] Performance — image optimization, caching and revalidation strategy for public routes, bundle audit
- [ ] Error handling — `error.tsx` / `not-found.tsx` per route group, sensible messages when PocketBase is unreachable
- [ ] Loading and empty states everywhere
- [ ] Security review — confirm API rules hold against a hostile client, verify admin credentials never reach the bundle, add rate limiting on public writes
- [ ] Tests — schema/validation units, then end-to-end coverage of the search → procedure → download path
- [ ] PocketBase backup and restore procedure, tested by actually restoring
- [ ] Deployment, environment configuration, monitoring

---

## Open questions

Each of these blocks work somewhere above and needs an answer from the project owner.

Items 1, 2, 4 and 5 were **provisionally decided** so the schema could be applied — the
choice is recorded below and is cheap to change now, expensive once the admin UI is built.

1. ~~**Provinces**~~ — *decided provisionally:* all 19 Iraqi governorates, in `en`/`ar`/`ku`, with ISO 3166-2 codes, centroid coordinates and a `krg` boolean. Confirm the Kurdish spellings.
2. ~~**`directorate_branches`**~~ — *decided provisionally:* treated as a legacy schema bug. Branches now relate to **both** a directorate (cascade delete) and a province.
3. **Real content** — does a non-placeholder export of the original database exist, or is all content being authored fresh? **Still open.** The seed is authored reference data, not a migration; procedure fees and processing times are plausible placeholders and must be confirmed with each directorate before launch.
4. ~~**`team.location` / `partners.location`**~~ — *decided provisionally:* modelled as selects rather than integers — `team.location` is `leadership | staff | advisory`, `partners.location` is `home | footer | partners_page`.
5. ~~**Moderation**~~ — *decided provisionally:* comments and reviews carry an `approved` flag and are hidden until staff approve them. The API rules prevent self-approval.
6. **Accounts** — can the public register, or is the `users` collection staff-only? **Still open.** Currently public signup is allowed but forced to `role = "user"`; closing it is a one-line rule change.
7. **Default locale** — which language does `/` redirect to, and is it fixed or negotiated from `Accept-Language`? **Still open.** The `default_locale` setting is seeded as `en` as a placeholder.

### Additions beyond the `CLAUDE.md` table

Flagged because they are schema decisions the doc did not specify:

- **Translatable addresses.** `ministries`, `directorates` and `directorate_branches` use `address_{en,ar,ku}` rather than the legacy single `address`, so an Arabic-only address is not shown to an English reader.
- **`slug` on `ministries`, `directorates`, `tags`** — the routes in `CLAUDE.md` are slug-based, but only `procedures` had a legacy `shortname`.
- **`fee_iqd` and `processing_time_{en,ar,ku}` on `procedures`** — the two questions citizens actually ask, absent from the legacy schema.
- **`summary_{en,ar,ku}` on `procedures`** — short text for cards and search results, distinct from the rich-text description.
- **`approved` on `comments` and `reviews`** — required by decision 5 above.
- **`status` and `handled_by` on `contact`** — makes the staff inbox in Phase 4 workable.
- **`external_url` on `files`** — for forms a directorate hosts itself rather than supplying to us.

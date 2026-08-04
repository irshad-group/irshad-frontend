# Changelog

All notable changes to the Irshad frontend are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `CLAUDE.md` — project guidance: stack, architecture, the legacy MySQL → PocketBase collection mapping, i18n/RTL rules, and code conventions.
- `PLAN.md` — phased build plan (foundation → schema → i18n → public portal → admin → migration → launch), plus the open questions blocking each phase.
- `CHANGELOG.md` — this file.
- `.mcp.json` — PocketBase MCP server configuration, pinned to an exact version. Credentials are filled in locally and must not be committed.
- `.env.example` — documented application environment variables.
- `.gitignore` — covers `node_modules`, Next.js build output, `.env*.local`, and `.mcp.json`.
- **PocketBase schema — all 17 content collections plus the extended `users` auth collection**, applied to the live instance and derived from `irshad_db.sql`. Staff can now manage ministries, directorates, provincial branches, procedures and their ordered steps, downloadable forms, tags, FAQ, slider, team, partners, navigation, settings, contact messages, comments and reviews.
- **API rules on every collection.** Published content is world-readable; unpublished, archived and unapproved rows are invisible to the public. Writes are limited to staff, deletes mostly to admins, and `contact` is create-only for visitors.
- `pocketbase/schema.json` — versioned snapshot of the schema so it is reviewable and reproducible.
- `pocketbase/seed/` — an idempotent development dataset (19 provinces, 14 ministries, 18 directorates, 12 branches, 20 tags, 15 procedures with 66 steps, 16 downloadable forms, plus FAQ, slider, team, partners, navigation, settings and sample user activity), all trilingual, with generated logos, banners and PDF forms.
- `pocketbase/seed/verify.mjs` — 34 assertions that exercise the API rules as an anonymous visitor, an end user and a moderator. All passing.

- **The Next.js application, scaffolded** — App Router, TypeScript, Tailwind 4, next-intl for `en`/`ar`/`ku` with RTL, and the PocketBase JS SDK. Pinned to Node 22 via `.nvmrc`.
- **Generated PocketBase types** (`src/types/pb.ts`) covering all 18 collections, produced from the schema snapshot by `npm run pb:types`. Relation fields carry the collection they point at, so a directorate id cannot be passed where a ministry id is expected.
- **The admin dashboard** at `/{locale}/admin`. Staff can sign in and manage every collection: procedures and their ordered steps, forms, tags, ministries, directorates, provincial branches, provinces, slider, FAQ, team, partners, navigation, settings, users, and the comment, review and contact inboxes.
- **Translation-aware editing.** Every translatable field shows English, Arabic and Kurdish side by side with empty languages flagged, and list views summarise which languages a record is still missing.
- **Moderation queues** on the dashboard for pending comments and reviews, with counts for unread contact messages and published procedures.
- Search, pagination and sorting on every collection list; file upload and replacement for logos, photos and documents.
- `docs/ADMIN.md` — how the admin is put together and what is deliberately not built.
- End-to-end tests: `npm run e2e:read` (44 checks) and `npm run e2e` (16 checks, real browser).
- **Locale switcher** in the public header — English, العربية and کوردی. Switching language keeps the visitor where they are: `/en/procedures/renew-iraqi-passport` becomes `/ar/procedures/renew-iraqi-passport`, query strings and all, instead of returning them to the home page. Each link carries `lang`/`hrefLang` so a screen reader announces it in its own voice, and the links are part of the prerendered HTML, so they are crawlable and work without JavaScript.
- A minimal public shell (`(public)/layout.tsx`) to host the switcher. The real header, navigation-driven menu and footer are still waiting on the design.
- **Design system foundations for the public portal.** IBM Plex Sans Arabic, self-hosted by `next/font` — one family covering Latin, Arabic and Kurdish Sorani, so no visitor's browser requests anything from Google. Its coverage of the Kurdish letters was verified against the font's character map and confirmed in-browser, rather than assumed. Arabic script now gets its own leading, staff-authored content renders with `dir="auto"`, long unbroken strings can no longer push a card past the viewport, and motion respects `prefers-reduced-motion`.
- `lib/pb/queries/public.ts` — the public portal's only route to PocketBase. Reads anonymously with no cookie, so pages stay statically renderable, and returns exactly what any visitor can see.
- Shared public primitives (`Container`, `Prose`, `EmptyState`) alongside the existing admin ones.
- **The public site shell** — a header whose menu comes from the `navigation` collection and a footer driven by `settings`, so staff change either in the admin without a deployment. Submenus and the mobile drawer are native `<details>` disclosures rather than scripted popovers: they open by click and by keyboard, are announced correctly by screen readers, and keep working when JavaScript never arrives. A skip-to-content link is the first tab stop on every page.
- **A unit test suite** (`vitest`) with a 100% coverage gate on lines, branches, functions and statements — 46 tests over the navigation tree, settings resolution, fee formatting, attachment resolution and query-parameter normalisation, including menu entries whose parent was deleted, moved to the other placement, or made to point at itself.
- **The procedure page** — the reason the site exists. Description, numbered steps in order, downloadable forms, fee, processing time, tags, and the directorate responsible, in the visitor's language. Every published procedure is prerendered; an unpublished or archived one returns 404 rather than a partial page, and is indistinguishable from one that never existed.
- **Search across all three languages at once**, so a term known in Arabic still finds the record while reading in Kurdish. It is a plain GET form: results have a shareable, bookmarkable, crawlable URL and work with no JavaScript.
- **The procedures index**, filterable by tag through links rather than script, so each filtered view has its own URL. A search that matches nothing offers a route onward instead of a dead end.
- **The home page**, replacing the placeholder: search first and large, then common and recently updated procedures, then an FAQ preview. The slider is deliberately not rendered as a rotating carousel — banners that move bury content, are awkward with a screen reader, and cost more than they return on a slow connection.
- Fees render in Latin digits in all three languages, matching how Iraqi government forms print them, so the figure on screen matches the printed schedule.
- **`e2e/public.mjs`** — 105 browser assertions across all three languages: direction, translated menus, disclosures, the skip link, the footer, no horizontal overflow at 320 px, and a pass with JavaScript disabled.
- `README.md`, and `specs/001-public-portal-ui/` — specification, implementation plan, research and data model for the citizen-facing portal, written with [Spec Kit](https://github.com/github/spec-kit) alongside a project constitution in `.specify/memory/`.

### Changed

- The route guard lives in `src/proxy.ts`. Next 16 renamed the `middleware` convention to `proxy`; `CLAUDE.md` now describes it correctly.

### Fixed

- Sign-in could not be retried after a wrong password. React 19 resets an uncontrolled form once its action resolves, which emptied the email box; the browser's `required` check then blocked the next submit without sending a request or showing an error. The same reset discarded everything typed into a record form whenever validation failed.

### Security

- The public site is a placeholder, so nothing citizen-facing reads from PocketBase yet.
- Staff sign-in refuses `user`-role accounts with the same wording as a wrong password, so the form cannot be used to discover which addresses belong to staff.
- Non-staff receive 404 rather than 403 across the admin, keeping the surface unenumerable.
- A signed-in user cannot escalate their own `role`: `users.updateRule` rejects any request whose body sets `role`, and `createRule` pins new signups to `user`.
- Comments and reviews cannot be self-approved or posted under another user's identity; both are held for staff moderation before they appear publicly.
- Archiving a procedure withdraws its steps and its downloadable forms in the same action, because those collections gate reads on the parent's state.

### Notes

- The **application** is still not scaffolded — this work covers the backend contract only; see `PLAN.md` Phase 0.
- Seed accounts share a well-known development password and must never be applied to a production instance.
- Legacy Kurdish fields were renamed `_kr` → `_ku` throughout, matching the routing locale.
- Decisions locked in so far: **Next.js (App Router)** as the frontend, **PocketBase** as the backend, and public portal plus admin CMS living in **one application** separated by route group.
- `irshad_db.sql` (2022 Laravel/MySQL dump) is kept as a schema reference. Its content rows are Faker-generated placeholders, so it is not a migration source.

---

<!--
Conventions for this file:

- Add entries under `## [Unreleased]` as work lands, not at release time.
- Group by: Added, Changed, Deprecated, Removed, Fixed, Security.
- Write for someone using the site or the admin panel — describe the change in
  terms of what they can now do, not which files moved.
- On release, rename `[Unreleased]` to `## [x.y.z] - YYYY-MM-DD` and open a new
  empty Unreleased section above it.
- Schema changes to PocketBase belong here too: they are the contract the whole
  app depends on, and they are the changes most likely to break a deployment.
-->

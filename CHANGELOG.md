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

### Changed

- The route guard lives in `src/proxy.ts`. Next 16 renamed the `middleware` convention to `proxy`; `CLAUDE.md` still describes it as `middleware.ts`.

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

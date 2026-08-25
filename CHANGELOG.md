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

- **A scraped directory of the Iraqi government** (`pocketbase/seed/scraped/`) — 42 ministries (23 federal, 19 Kurdistan Region), 362 directorates and 687 provincial branch offices across all 19 governorates, with coordinates, phone numbers, addresses, building photos, official ministry logos and — where a source publishes them — opening hours. Sources are gov.krd, `ur.gov.iq`'s public API, the ministries' own sites, Google Maps and OpenStreetMap; every field records which one it came from. **Not yet imported** — the dataset and the scrapers that rebuild it are checked in for review first.
- `pocketbase/seed/import-geography.mjs` — upserts that dataset by slug and never deletes, so the development seed's directorates keep the procedures already attached to them.
- `pocketbase/seed/clear-seed-placeholders.mjs` — removes the 34 invented phone numbers the development seed had written onto ministries, directorates and branches. Harmless while those collections held only seed data; not harmless sitting beside 198 scraped numbers, where a reader cannot tell them apart and would dial one.
- **The home page map now actually draws.** It had been rendering its static SVG fallback in production while the real map sat invisible behind it: maplibre-gl 6 parses tiles in a separate worker, Next's bundler broke the URL it derives for that worker, and the failure was silent — no error, no tiles, the map's `load` event never firing. The worker is now served from our own origin.
- **A real map on ministry and directorate pages.** The address panel now carries a pannable, zoomable map centred on the office with a pin on it, and a button that opens the reader's own maps application. Server-rendered tiles show first and remain if JavaScript is off, so the panel is never a grey rectangle.
- **Building photos at full size, and a lightbox to see them in.** Every photo the scrape stored was a 114-pixel Google thumbnail; they are now the real photographs, up to 1600 pixels. A ministry's building is shown as a banner on its page and opens full size over the page, with a close button in the corner.
- **Building photos and opening hours on every provincial office.** The directorate page now shows each office's photo and weekly hours beside its address — 571 building photos had been collected and stored without ever being rendered, though wayfinding to an unfamiliar office is the whole reason the field exists.
- **Provincial office coverage across the whole country.** 1,797 branch offices (up from 687) reaching 37 of 42 ministries (up from 15), including the Kurdistan Region, whose bodies are now searched only in the four governorates they exist in. Ministry pages say how far each directorate reaches — "36 offices in 18 governorates" — so a reader can see at a glance whether there is one near them instead of having to open each directorate to find out.
- `pocketbase/seed/purge-non-dataset.mjs` — deletes every ministry, directorate and branch the scraped dataset does not contain, so the backend carries the real directory and nothing else. Refuses to delete a row anything still points at. The site's invented contact phone and its misleading `@irshad.gov.iq` address — on a site whose own header says it is not affiliated with any government body — were cleared too.
- `pocketbase/migrations/001-geography-contact-fields.mjs` — adds the eight fields the dataset needs that the schema lacks: `photos` and `working_hours` on `ministries`, `website`, `email` and `working_hours` on `directorate_branches`, and a stable Google `place_id` on all three. **Applied to the live instance**, along with the dataset itself: the backend now holds 42 ministries, 362 directorates and 699 branches. The 15 seeded procedures keep their directorates.
- **Locale switcher** in the public header — English, العربية and کوردی. Switching language keeps the visitor where they are: `/en/procedures/renew-iraqi-passport` becomes `/ar/procedures/renew-iraqi-passport`, query strings and all, instead of returning them to the home page. Each link carries `lang`/`hrefLang` so a screen reader announces it in its own voice, and the links are part of the prerendered HTML, so they are crawlable and work without JavaScript.
- A minimal public shell (`(public)/layout.tsx`) to host the switcher. The real header, navigation-driven menu and footer are still waiting on the design.
- **Design system foundations for the public portal.** IBM Plex Sans Arabic, self-hosted by `next/font` — one family covering Latin, Arabic and Kurdish Sorani, so no visitor's browser requests anything from Google. Its coverage of the Kurdish letters was verified against the font's character map and confirmed in-browser, rather than assumed. Arabic script now gets its own leading, staff-authored content renders with `dir="auto"`, long unbroken strings can no longer push a card past the viewport, and motion respects `prefers-reduced-motion`.
- `lib/pb/queries/public.ts` — the public portal's only route to PocketBase. Reads anonymously with no cookie, so pages stay statically renderable, and returns exactly what any visitor can see.
- Shared public primitives (`Container`, `Prose`, `EmptyState`) alongside the existing admin ones.
- **The public site shell** — a header whose menu comes from the `navigation` collection and a footer driven by `settings`, so staff change either in the admin without a deployment. Submenus and the mobile drawer are native `<details>` disclosures rather than scripted popovers: they open by click and by keyboard, are announced correctly by screen readers, and keep working when JavaScript never arrives. A skip-to-content link is the first tab stop on every page.
- **A unit test suite** (`vitest`) with a 100% coverage gate on lines, branches, functions and statements — 84 tests over the navigation tree, settings resolution, fee formatting, attachment resolution, query-parameter normalisation, coordinate validation, province grouping, tag counting and contact validation, including menu entries whose parent was deleted, moved to the other placement, or made to point at itself.
- **The procedure page** — the reason the site exists. Description, numbered steps in order, downloadable forms, fee, processing time, tags, and the directorate responsible, in the visitor's language. Every published procedure is prerendered; an unpublished or archived one returns 404 rather than a partial page, and is indistinguishable from one that never existed.
- **Search across all three languages at once**, so a term known in Arabic still finds the record while reading in Kurdish. It is a plain GET form: results have a shareable, bookmarkable, crawlable URL and work with no JavaScript.
- **The procedures index**, filterable by tag through links rather than script, so each filtered view has its own URL. A search that matches nothing offers a route onward instead of a dead end.
- **The home page**, replacing the placeholder: search first and large, then common and recently updated procedures, then an FAQ preview. The slider is deliberately not rendered as a rotating carousel — banners that move bury content, are awkward with a screen reader, and cost more than they return on a slow connection.
- Fees render in Latin digits in all three languages, matching how Iraqi government forms print them, so the figure on screen matches the printed schedule.
- **Ministries and directorates** — index and detail for both. A ministry lists its directorates; a directorate links back to its ministry, lists the procedures it handles, and groups its provincial offices by province. Ministries filter to federal or Kurdistan Regional Government, which is what the seeded header menu already linked to; directorates filter by province, answering the question a citizen actually asks — who can I go to near me.
- **Office locations link out instead of embedding a map.** An embedded map is usually the heaviest thing on a page and hands every visitor's IP to a third party before they have asked for one; a link does the same job for the people who want it and costs nothing for everyone else. A record with one coordinate, a swapped pair, or `0,0` renders as a plain address rather than pointing someone at the wrong place.
- **FAQ, team and partners pages**, and a **contact form** — the portal's only public write. It runs anonymously, because `contact` has a create-only rule for visitors and a privileged client here would bypass the very rule that limits what the public can do. Every field is re-validated on the server with Zod regardless of what the browser checked, errors are returned as codes and rendered from the message catalogue so they appear in the visitor's own language, and a failed submission never loses what was typed.
- A honeypot field catches naive bots and reports success to them without storing anything, so they learn nothing about why they failed. It is off-screen and hidden from assistive technology, so a screen-reader user never meets it.
- **A tag index at `/procedures/tags`**, showing each tag with how many procedures carry it. This is where the "Browse by Tag" entry in the seeded `navigation` collection already pointed — the link had been returning 404. Tags with nothing published behind them are not offered, since they would be a dead end.
- **Error and not-found pages**, in the visitor's own language. A 404 raised from inside the portal keeps the header, menu and footer, because the commonest 404 here is a citizen following a stale link to a withdrawn procedure and they should be able to navigate on from it. An error page never shows the underlying failure, which would be English, technical and occasionally revealing about the backend; it offers a retry and a reference code instead. `global-error` covers the case where the locale layout itself failed and the language is therefore unknown — it says the same thing in all three, each with its own `lang` and `dir`.
- **`e2e/public.mjs`** — 213 browser assertions across all three languages: direction, translated menus, disclosures, the skip link, the footer, no horizontal overflow at 320 px, and a pass with JavaScript disabled.
- `README.md`, and `specs/001-public-portal-ui/` — specification, implementation plan, research and data model for the citizen-facing portal, written with [Spec Kit](https://github.com/github/spec-kit) alongside a project constitution in `.specify/memory/`.

- **Citizen accounts.** Register, sign in with a password or a 6-digit one-time code by email (PocketBase OTP, enabled on `users`; requires SMTP to be configured in PocketBase settings before codes actually deliver), a profile page listing the visitor's suggestions with review status, and sign-out — all as Server Actions over the existing httpOnly-cookie session, with no superuser client anywhere in the path and enumeration-safe error wording. The header offers a "Sign in" link and a "Suggest a procedure" button (plus a compact account icon on phones) — all static links, so no public page loses static rendering; the account pages themselves decide between profile and sign-in.
- **A procedure-suggestion wizard** at `/account/submit`: three parts (what it is → steps and requirements → extras and review) rendered as ONE form, so without JavaScript it is simply a single long form that still submits. Steps and documents are typed one per line; ministries and directorates are picked from what exists — citizens cannot create either. Submissions land in the new `procedure_submissions` collection (`status = submitted` and the owner pinned by API rule — verified live: forged status, forged owner, anonymous listing, and non-staff updates are all refused) and appear in both admins' Inbox for review; nothing publishes without staff creating the real procedure.
- **The procedure page was rebuilt to the design's anatomy layout**: topic eyebrow with its icon, a facts strip (fee, time, step count), the steps as a connected numbered path, forms and tags with icons, and a "responsible office" card carrying the directorate's address, structured working hours, building photos, and a maps link.

### Changed

- The route guard lives in `src/proxy.ts`. Next 16 renamed the `middleware` convention to `proxy`; `CLAUDE.md` now describes it correctly.
- **The home page was rebuilt to the "Irshad Homepage v2" design** (from the Claude Design project): a search-first hero with a how-it-works panel, a stats strip with live counts, most-requested procedures with fees and step counts, browse-by-topic and by-ministry grids, an anatomy-of-a-procedure explainer, a static SVG map of Iraq with real provincial offices, recent updates beside an FAQ preview, and a contact call to action. Everything is server-rendered from live PocketBase data — no client JavaScript, no CDN — and the page stays statically generated (`●`) in all three languages. The Iraq outline was projected once from world-atlas data and committed as constants (`lib/public/geo.ts`), so placing an office on the map costs a pure function, not a D3 download.
- **The design tokens moved from the deep-green palette to the design's indigo/navy/gold** (`brand-*` on `#1E2A78`, `ink-*` retinted toward navy `#0B1030`, new `gold-*` accent). Every text/background pair keeps WCAG AA. The site shell followed: a navy utility strip carries the independence disclaimer on every page, the header gained the block brand mark, and the footer is navy with the full disclaimer as fixed chrome staff cannot edit away.
- **The home page gained motion, a real map, and a proper icon set.** Sections and cards reveal on scroll via framer-motion, as client leaves wrapping server-rendered children — with JavaScript disabled the hidden initial state is never applied, so nothing disappears; `prefers-reduced-motion` disables it entirely. The map section is now a zoomable MapLibre GL vector map (OpenFreeMap tiles — the one external service the portal now talks to) with a marker per province that has offices, self-hosted RTL text plugin for Arabic labels, and the static SVG as the no-JS/failure fallback. Categories, popular procedures and topics carry per-subject vector icons matched from tag slugs (passport, ID, vehicles, tax, health, education, courts, …), falling back to a document glyph.
- **Admin list views: ministry logos and a ministry filter.** The registry gained an `image` column kind (ministries now lead with their logo as a thumbnail) and a `listFilter` relation dropdown (directorates filter by ministry, composed with search and resetting pagination). Both admins render them from the same registry metadata.
- **`directorates.working_hours` became a structured JSON schedule** — `[{day:'SUN',from:'08:00',to:'14:00',note?}]`, `null` times meaning closed — replacing free text, so day names now render in the reader's language (`lib/public/hours.ts` parses defensively and collapses the week into ranges; `WorkingHours` renders the full table on directorate pages and a one-line summary on ministry pages). The admin gained a `json` field kind that validates before saving. Existing data was migrated in place.
- **`directorates` and `directorate_branches` gained a `photos` field** (up to 10 images) so a page can show the building itself — a photograph of the entrance is often better wayfinding than an address. The admin file input now supports multi-file fields; new uploads add to the gallery rather than replacing it.
- **`faq` gained an optional relation → `procedures`**, so a question can be tied to the specific procedure it is about. General questions remain valid with the field empty.
- **`working_hours_{en,ar,ku}` on `directorates` collapsed into a single `working_hours` field**, localised at render time instead of stored three times. Existing English values were migrated; the portal currently renders the stored text as-is, so a localisation format for it is still to be designed.

### Fixed

- **Saving a record with a file upload destroyed its JSON fields.** When a save carries a file, the admin switches to FormData and stringified every other value with `String()` — which turns a parsed JSON value like the working-hours schedule into `[object Object]` entries. Editing a directorate's schedule and its logo in the same save would have silently wiped the schedule. JSON fields are now re-serialised with `JSON.stringify`, which PocketBase parses back into real JSON (verified against the live instance). Found by the Vite admin port while reusing the same registry.

- **A fee crashed the page when the URL's first segment was not a locale.** `formatFee` built an `Intl.NumberFormat` tag from it, so a request for `/favicon.ico` produced `favicon.ico-u-nu-latn` and a `RangeError` that took down every procedure card on the page. Found in the server log while debugging something unrelated. An unusable tag now falls back to English formatting — grouping a number is never worth losing the page over.

- Sign-in could not be retried after a wrong password. React 19 resets an uncontrolled form once its action resolves, which emptied the email box; the browser's `required` check then blocked the next submit without sending a request or showing an error. The same reset discarded everything typed into a record form whenever validation failed.

### Security

- The public site is a placeholder, so nothing citizen-facing reads from PocketBase yet.
- Staff sign-in refuses `user`-role accounts with the same wording as a wrong password, so the form cannot be used to discover which addresses belong to staff.
- Non-staff receive 404 rather than 403 across the admin, keeping the surface unenumerable.
- A signed-in user cannot escalate their own `role`: `users.updateRule` rejects any request whose body sets `role`, and `createRule` pins new signups to `user`.
- Comments and reviews cannot be self-approved or posted under another user's identity; both are held for staff moderation before they appear publicly.
- Archiving a procedure withdraws its steps and its downloadable forms in the same action, because those collections gate reads on the parent's state.

### Notes

- **Contact messages carry no IP address or user agent.** Both fields are marked hidden in the schema, and PocketBase strips hidden fields from a create it does not trust — verified against the live instance, where an anonymous create supplying them stores empty strings. Populating them would require a privileged client on a public endpoint, which is precisely what must not happen. To get this data, either unhide the fields in the schema or capture it at the edge.
- **No rate limiting on the contact form.** The create-only API rule and the honeypot are the only protections; a determined submitter can still flood the inbox. This needs infrastructure the app does not have.
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

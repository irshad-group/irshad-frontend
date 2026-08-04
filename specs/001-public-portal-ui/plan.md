# Implementation Plan: Public Portal UI/UX

**Branch**: `001-public-portal-ui` | **Date**: 2026-08-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-public-portal-ui/spec.md`

## Summary

Build the citizen-facing portal on top of the finished PocketBase backend: home,
search, procedure detail, ministries, directorates, branches by province, FAQ,
contact, team and partners — trilingual, RTL-correct, and fast on a weak
connection.

The technical approach is deliberately conservative. Pages are Server Components
reading PocketBase anonymously, statically rendered with tag-based revalidation
where content allows. Client JavaScript appears only where interaction genuinely
requires it: the language switcher (already built), the FAQ disclosures, the
province filter, and the contact form. The visual design is a small typographic
system — one trilingual typeface, a restrained palette built on the existing
green, generous spacing, and card and list primitives shared across every page —
rather than a per-page composition.

Delivery follows the spec's four priorities. **P1 (search plus procedure detail)
is a complete, shippable public service on its own** and is sequenced first.

## Technical Context

**Language/Version**: TypeScript 5 (strict), React 19, Node 22.22.1

**Primary Dependencies**: Next.js 16.3 (App Router, Turbopack), next-intl 4.13,
PocketBase JS SDK 0.27, Tailwind 4, Zod 4

**Storage**: PocketBase at `https://irshad-api.esite-lab.com` — read anonymously
for all public pages; `contact` is the only public write

**Testing**: `npm run typecheck`, `npm run lint`, `npm run build`; Playwright for
end-to-end journeys (harness already present in `e2e/`); axe for accessibility;
Lighthouse for performance budgets

**Target Platform**: Mobile-first web; baseline is a mid-range Android phone on
3G. Must degrade to no-JavaScript.

**Project Type**: Web application — public portal and staff admin in one Next.js
app, separated by route group

**Performance Goals**: LCP < 2.5 s and CLS < 0.1 on simulated 3G; content pages
statically rendered and served from cache

**Constraints**: WCAG 2.2 AA; usable from 320 px; three locales, two directions;
no page may render blank where a translation is missing

**Scale/Scope**: ~15 route files covering 14 ministries, 18 directorates, 12
branches, 15 procedures with 66 steps, growing to low hundreds of procedures

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | How this plan satisfies it | Risk |
|---|---|---|
| **I. Authorization in PocketBase** | Every public read is anonymous, so the API rules are the only thing standing between a visitor and the data — no UI-level filtering is trusted. Unpublished and archived records are already invisible to an anonymous client; pages call `notFound()` on an empty result rather than rendering a shell. | Low |
| **II. Server Components by default** | All content pages are Server Components. Four client islands only: language switcher, FAQ disclosure, province filter, contact form. Each is a leaf. | Low — must resist making listing pages client-side for filtering |
| **III. Trilingual and bidirectional** | Every content read goes through `localized()`. Layout uses logical properties exclusively. A self-hosted trilingual typeface is chosen in Phase 0. Each screen is reviewed in all three languages before it is called done. | **Highest risk in the feature** — see research |
| **IV. Slow connection, screen reader** | Static rendering with tag-based revalidation; sized and lazy images; semantic elements; a keyboard pass and an axe pass per route. | Medium — third-party map embeds would break this, hence the open question |
| **V. Content is data, chrome is messages** | Page furniture goes to `messages/*.json`; everything else comes from PocketBase. The header menu and footer read `navigation` and `settings` rather than being hardcoded. | Low |

**Gate result: PASS.** No violations to justify; the Complexity Tracking table
below is empty by design.

## Project Structure

### Documentation (this feature)

```text
specs/001-public-portal-ui/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 — design and technical decisions
├── data-model.md        # Phase 1 — collections mapped to routes and queries
├── quickstart.md        # Phase 1 — how to run and verify the portal
└── checklists/
    └── requirements.md  # Specification quality checklist
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── not-found.tsx, global-error.tsx      # outside any locale
│   └── [locale]/
│       ├── error.tsx, not-found.tsx         # no shell available
│       └── (public)/
│           ├── layout.tsx                   # shell: navigation menu + settings footer
│           ├── error.tsx, not-found.tsx     # same views, inside the shell
│           ├── page.tsx                     # home
│           ├── search/page.tsx
│           ├── procedures/{page,[slug]/page,tags/page}.tsx
│           ├── ministries/{page,[slug]/page}.tsx
│           ├── directorates/{page,[slug]/page}.tsx
│           ├── faq/page.tsx
│           ├── contact/{page.tsx,actions.ts}
│           ├── team/page.tsx
│           └── partners/page.tsx
├── components/public/
│   ├── SiteHeader.tsx, SiteFooter.tsx, LocaleSwitcher.tsx
│   ├── SearchBox.tsx, ProcedureCard.tsx, FileList.tsx
│   ├── LocationBlock.tsx, ContactForm.tsx, NotFoundView.tsx
├── components/ui/primitives.tsx             # extended, not forked
├── lib/pb/queries/public.ts                 # every public read, one module
├── lib/public/{navigation,settings,procedures,places,contact}.ts
└── messages/{en,ar,ku}.json

e2e/public.mjs                               # 213 assertions, mirroring e2e/admin.mjs
```

> Built structure, not the original sketch. Three planned components were not
> needed: FAQ and the mobile drawer use native `<details>` rather than a
> scripted `FaqAccordion`, the province filter is links rather than a client
> island (`ProvinceFilter`), and `EmptyState` belongs with the shared
> primitives. `ProcedureSteps` stayed inline in the procedure page, which is its
> only caller.

**Structure Decision**: The existing single-application layout is kept. The
public portal lives entirely under the `(public)` route group, sharing
`components/ui/primitives.tsx` and the `lib/pb` clients with the admin. Public
reads are concentrated in one query module so that caching and revalidation are
decided in a single place rather than scattered across pages. The `(public)`
layout and `LocaleSwitcher` already exist and are extended rather than replaced.

## Delivery Phases

Each phase is independently shippable and maps to a spec priority.

### Phase 0 — Research and foundations — **DONE**

Resolve the open questions and put the design system in place. No routes yet.

- Choose and self-host the trilingual typeface; verify Kurdish letterforms.
- Fix the type scale, spacing, colour tokens and focus treatment in
  `globals.css`; check contrast against WCAG 2.2 AA.
- Extend `primitives.tsx` with the public-facing pieces the pages will share.
- Build `lib/pb/queries/public.ts` with typed, cached readers.
- Settle the three clarifications in the spec (accounts, brand, map provider).

**Exit:** a rendered type-and-colour specimen in all three languages, reviewed at
320 px and 1280 px.

### Phase 1 — The site shell — **DONE**

- `SiteHeader` driven by `navigation`, `SiteFooter` driven by `settings`.
- Skip-to-content link, focus styles, landmark structure.
- Audit the existing stylesheet for physical `left`/`right` and replace with
  logical properties.

**Exit:** every future page inherits a correct, accessible, bidirectional frame.

### Phase 2 — P1: search and procedure detail — **DONE**

- `procedures/[slug]` — description, ordered steps, forms, fee, processing time,
  tags, responsible directorate.
- `search` and `procedures` index with tag filtering and a useful empty state.
- Home page: slider, featured and recent procedures, FAQ preview.

**Exit:** a citizen can find a procedure and read how to complete it. **This is
the minimum shippable public service.**

### Phase 3 — P2: institutions and places — **DONE**

- Ministries and directorates, index and detail.
- Branches grouped and filtered by province; working hours and contact details.
- Branch location, rendered per the map decision from Phase 0.

**Exit:** a citizen knows which office to attend and when it is open.

### Phase 4 — P3/P4: support pages — **DONE**

- FAQ accordion, contact form with Server Action and Zod validation, team,
  partners.

**Exit:** the portal is feature-complete against the spec.

### Phase 5 — Verification — **PARTLY DONE**

- [x] `e2e/public.mjs`: the P1 journey in all three languages — 213 assertions.
- [x] JavaScript-disabled pass: menus, search, procedure pages, disclosures.
- [x] Anonymous probe of archived and missing records (SC-008) — 404, and the
      two cases are indistinguishable.
- [x] No horizontal overflow at 320px, in both directions, on every listing.
- [ ] **axe pass per route** — not run. The suite checks structure (labels,
      landmarks, `aria-current`, focus order) but no automated WCAG rule engine
      has been run against it.
- [ ] **Keyboard-only pass with real assistive technology** — the skip link and
      tab order are tested programmatically; nobody has driven it with a screen
      reader.
- [ ] **Lighthouse against the SC-003 budget on throttled 3G** — not measured.
      Static rendering is in place, but LCP and CLS are unverified numbers.
- [ ] **Deliberately untranslated record to prove the fallback (SC-007)** — the
      `localized()` chain is unit-tested, but no record has been emptied in one
      language to prove it end to end.

### Not built, and why

- **Comments and reviews** — the schema and moderation queues exist, but they
  need signed-in citizens and the accounts question is unanswered. Recorded as
  the first clarification in `spec.md`.
- **Sitemap and structured data** — per-locale metadata and `hreflang` are done
  on every detail page; discovery beyond that is not.
- **Rate limiting on the contact form** — needs infrastructure the app does not
  have. The create-only rule and the honeypot are the only protections.
- **IP and user agent on contact messages** — PocketBase strips hidden fields
  from an untrusted create, verified against the live instance. Populating them
  would need a privileged client on a public endpoint.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified.

No violations. The plan adds no new dependencies, no new services, and no
abstraction beyond one query module.

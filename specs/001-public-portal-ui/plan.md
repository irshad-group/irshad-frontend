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
├── app/[locale]/(public)/
│   ├── layout.tsx                    # EXISTS — grows into the real shell
│   ├── page.tsx                      # REPLACE — placeholder becomes home
│   ├── search/page.tsx
│   ├── procedures/
│   │   ├── page.tsx                  # index, filterable by tag
│   │   └── [slug]/page.tsx           # THE page the site exists for
│   ├── ministries/{page,[slug]/page}.tsx
│   ├── directorates/{page,[slug]/page}.tsx
│   ├── faq/page.tsx
│   ├── contact/{page,actions.ts}
│   ├── team/page.tsx
│   └── partners/page.tsx
├── components/public/
│   ├── LocaleSwitcher.tsx            # EXISTS
│   ├── SiteHeader.tsx                # navigation-driven menu
│   ├── SiteFooter.tsx                # settings-driven contact details
│   ├── SearchBox.tsx
│   ├── ProcedureCard.tsx
│   ├── ProcedureSteps.tsx
│   ├── FileList.tsx
│   ├── FaqAccordion.tsx              # client island
│   ├── ProvinceFilter.tsx            # client island
│   ├── ContactForm.tsx               # client island
│   ├── BranchLocation.tsx
│   └── EmptyState.tsx
├── components/ui/primitives.tsx      # EXISTS — extend, do not fork
├── lib/pb/queries/public.ts          # every public read, one module
└── messages/{en,ar,ku}.json          # EXISTS — extend

e2e/public.mjs                        # journeys, mirroring e2e/admin.mjs
```

**Structure Decision**: The existing single-application layout is kept. The
public portal lives entirely under the `(public)` route group, sharing
`components/ui/primitives.tsx` and the `lib/pb` clients with the admin. Public
reads are concentrated in one query module so that caching and revalidation are
decided in a single place rather than scattered across pages. The `(public)`
layout and `LocaleSwitcher` already exist and are extended rather than replaced.

## Delivery Phases

Each phase is independently shippable and maps to a spec priority.

### Phase 0 — Research and foundations

Resolve the open questions and put the design system in place. No routes yet.

- Choose and self-host the trilingual typeface; verify Kurdish letterforms.
- Fix the type scale, spacing, colour tokens and focus treatment in
  `globals.css`; check contrast against WCAG 2.2 AA.
- Extend `primitives.tsx` with the public-facing pieces the pages will share.
- Build `lib/pb/queries/public.ts` with typed, cached readers.
- Settle the three clarifications in the spec (accounts, brand, map provider).

**Exit:** a rendered type-and-colour specimen in all three languages, reviewed at
320 px and 1280 px.

### Phase 1 — The site shell (unblocks everything)

- `SiteHeader` driven by `navigation`, `SiteFooter` driven by `settings`.
- Skip-to-content link, focus styles, landmark structure.
- Audit the existing stylesheet for physical `left`/`right` and replace with
  logical properties.

**Exit:** every future page inherits a correct, accessible, bidirectional frame.

### Phase 2 — P1: search and procedure detail

- `procedures/[slug]` — description, ordered steps, forms, fee, processing time,
  tags, responsible directorate.
- `search` and `procedures` index with tag filtering and a useful empty state.
- Home page: slider, featured and recent procedures, FAQ preview.

**Exit:** a citizen can find a procedure and read how to complete it. **This is
the minimum shippable public service.**

### Phase 3 — P2: institutions and places

- Ministries and directorates, index and detail.
- Branches grouped and filtered by province; working hours and contact details.
- Branch location, rendered per the map decision from Phase 0.

**Exit:** a citizen knows which office to attend and when it is open.

### Phase 4 — P3/P4: support pages

- FAQ accordion, contact form with Server Action and Zod validation, team,
  partners.

**Exit:** the portal is feature-complete against the spec.

### Phase 5 — Verification

- `e2e/public.mjs`: the P1 journey in all three languages.
- axe pass per route; keyboard-only pass; JavaScript-disabled pass.
- Lighthouse against the SC-003 budget on throttled 3G.
- Deliberately untranslated record to prove the fallback (SC-007), and an
  anonymous probe of archived records (SC-008).

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified.

No violations. The plan adds no new dependencies, no new services, and no
abstraction beyond one query module.

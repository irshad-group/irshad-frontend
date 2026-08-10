# Irshad Frontend Constitution

Irshad is a public information service: it tells citizens of Iraq how to complete
government procedures. The people who need it most are on cheap phones and poor
connections, and many are reading in a language and a direction the web treats as
an afterthought. Every principle below follows from that.

## Core Principles

### I. Authorization lives in PocketBase, never in the UI

Hiding a control is presentation. The list/view/create/update/delete rules on each
collection are the enforcement, and they are written assuming a hostile client.
No feature may rely on the interface withholding an action to keep data safe. The
public portal reads as an anonymous visitor and must therefore be correct when the
API returns nothing — an unpublished procedure's attachments simply do not list.

### II. Server Components by default

`'use client'` is added only for genuine interactivity, and pushed to the leaves of
the tree. A page that renders content the visitor merely reads has no business
shipping JavaScript to do it. Anything a crawler or a visitor without JavaScript
should see must exist in the server-rendered HTML — this is a government
information service, so being findable and degrading gracefully are requirements,
not niceties.

### III. Trilingual and bidirectional by construction

English, Arabic and Kurdish (Sorani) are equals; Arabic and Kurdish are RTL. `dir`
comes from the active locale, and layout uses CSS logical properties, never
physical `left`/`right`. Content is frequently only partly translated, so every
content read goes through the fallback chain — requested locale, English, first
non-empty — rather than rendering a blank. A design that only looks right in
English is not done.

### IV. Reachable on a slow connection and with a screen reader

Pages are cached or statically rendered wherever the content allows. Images are
sized, and lazy where they are not above the fold. Interactive controls are real
semantic elements, reachable by keyboard, with visible focus and accessible names
in the active language. Colour is never the only carrier of meaning. Target
WCAG 2.2 AA.

### V. Content is data; chrome is messages

UI strings (button labels, validation text) live in `messages/*.json`. Content
(procedure titles, FAQ bodies) lives in the suffixed PocketBase fields and is
edited by staff. Neither ever moves into the other. No page hardcodes an
`_en`/`_ar`/`_ku` suffix at a call site; resolution goes through the shared helper
so the fallback stays uniform.

## Technical Constraints

- Next.js App Router with TypeScript strict, Tailwind, next-intl, PocketBase.
- Locale is the first path segment; slugs are single-valued and shared across
  languages, so a URL differs between languages only in that segment.
- Record types are generated from the live schema into `src/types/pb.ts` and
  regenerated after every schema change. Relation ids are never hand-written.
- Mutations go through Server Actions validated with Zod. A client-supplied
  `role`, `enabled` or relation id is never trusted.
- One PocketBase instance per server request; never a module-level singleton.

## Development Workflow

- `npm run typecheck`, `npm run lint` and `npm run build` all pass before work is
  considered done.
- `CHANGELOG.md` gains an entry under `## [Unreleased]` for anything
  user-visible; `PLAN.md` items are ticked as they land.
- When this document and the live PocketBase schema disagree, the schema wins —
  then this document is corrected.

## Governance

This constitution governs feature specifications and implementation plans in this
repository. A plan that violates a principle must either be changed or record the
violation, with justification, in its Complexity Tracking table. Amendments are
made by editing this file and noting the change in `CHANGELOG.md`.

**Version**: 1.0.0 | **Ratified**: 2026-08-04 | **Last Amended**: 2026-08-04

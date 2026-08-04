# Irshad — Guide to Government Services

A trilingual public portal telling citizens of Iraq how to complete government
procedures: what the steps are, which documents to bring, what it costs, how long
it takes, and which office to attend.

Two applications share one Next.js codebase, separated by route group:

- **The public portal** (`(public)`) — citizen-facing, read-only, English /
  العربية / کوردی.
- **The staff admin** (`(admin)`) — a CMS over all 18 PocketBase collections,
  built and in use.

## Status

| Area | State |
|---|---|
| PocketBase schema, API rules, seed data | Done — 18 collections, verified against the live instance |
| Staff admin | Done — every collection, with moderation queues |
| i18n and routing | Done — `en`/`ar`/`ku`, RTL, locale switcher |
| Design system foundations | Done — typeface, tokens, primitives, public query layer |
| Public portal pages | **In progress** — see `specs/001-public-portal-ui/plan.md` |

Full history is in [CHANGELOG.md](./CHANGELOG.md); the build sequence is in
[PLAN.md](./PLAN.md).

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript strict · Tailwind 4 ·
next-intl · PocketBase · Zod · Node 22 (see `.nvmrc`)

The backend is PocketBase. There is no separate API layer: pages read PocketBase
directly, and PocketBase's per-collection API rules are the authorization.

## Getting started

```bash
npm install
```

Copy `.env.example` to `.env.local` and set the PocketBase URL:

```bash
NEXT_PUBLIC_PB_URL=https://your-pocketbase-host
```

That is all the public portal needs — it reads **anonymously**. Superuser
credentials are only required for schema and seed tooling, and must never be
used to serve ordinary user requests.

```bash
npm run dev
```

Then visit `/en`, `/ar` or `/ku`. There is no unprefixed route: the locale is
always the first path segment.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Unit tests (vitest) |
| `npm run test:coverage` | Unit tests with the 100% coverage gate |
| `npm run e2e:public` | Public shell end-to-end, all three languages |
| `npm run pb:types` | Regenerate `src/types/pb.ts` from the schema snapshot |
| `npm run pb:seed` | Seed a development instance (writes data) |
| `npm run pb:verify` | 34 API-rule assertions against a hostile client |
| `npm run e2e` / `e2e:read` | Browser and read-path end-to-end tests |

`e2e:public` is read-only and needs a server running (`npm run build && npm run
start`, then `BASE_URL=http://localhost:3000 npm run e2e:public`). It also needs
the Playwright browser once: `npx playwright install chromium`.

**Every finished function gets unit tests to 100% coverage, then an end-to-end
pass in a real browser, and only then a commit.** See the Testing section of
[CLAUDE.md](./CLAUDE.md).

`pb:seed`, `pb:verify` and `e2e` all **write to whichever instance the app points
at** — run them against a development instance only. They read `PB_URL`,
`PB_EMAIL` and `PB_PASSWORD` from the process environment, which are *different
names* from the `NEXT_PUBLIC_PB_URL` / `PB_ADMIN_*` used by the app in
`.env.local`.

## Environment

Two independent places PocketBase is configured. Both are gitignored and must
never be committed.

| File | Purpose | Keys |
|---|---|---|
| `.env.local` | The application | `NEXT_PUBLIC_PB_URL`, `PB_ADMIN_EMAIL`, `PB_ADMIN_PASSWORD` |
| `.mcp.json` | Claude Code's own PocketBase access | `POCKETBASE_URL`, `POCKETBASE_ADMIN_EMAIL`, `POCKETBASE_ADMIN_PASSWORD` |

Only the URL belongs behind `NEXT_PUBLIC_` — it is inlined into the client
bundle and is public by definition. The admin credentials are server-only.

## Project layout

```text
src/
├── app/[locale]/
│   ├── (public)/         # Citizen-facing portal
│   └── (admin)/admin/    # Staff CMS
├── components/
│   ├── ui/primitives.tsx # Shared design primitives
│   ├── public/           # Public composites
│   └── admin/            # Admin composites
├── lib/
│   ├── pb/queries/public.ts  # Anonymous reads — the public portal's only door
│   ├── pb/{client,server,collections}.ts
│   └── i18n.ts           # localized() fallback helper
├── types/pb.ts           # Generated — never hand-edit
├── messages/             # UI strings only, never content
└── proxy.ts              # Locale negotiation + admin route guard

pocketbase/               # Schema snapshot, seed, rule verification
specs/                    # Spec Kit feature specs and plans
docs/ADMIN.md             # How the admin is put together
```

## Things that will bite you

- **Locale is in the URL.** `/procedures` does not exist; only
  `/en/procedures`, `/ar/procedures`, `/ku/procedures`.
- **Two kinds of translation.** UI strings live in `messages/*.json`; content
  lives in suffixed PocketBase fields (`title_en`, `title_ar`, `title_ku`).
  Never mix them. Read content through `localized()` so the fallback chain —
  requested language, English, first non-empty — stays uniform.
- **Kurdish is not just "Arabic script".** Sorani uses ڕ ڵ ۆ ێ گ چ پ ژ. If the
  typeface lacks them the browser silently substitutes another face for single
  letters, which looks broken to a Kurdish reader and fine to everyone else.
  Verify coverage before changing fonts.
- **`cookies()` breaks static rendering.** Public pages must not use
  `pbServer()`. Watch for a route flipping from `●` to `ƒ` in the build output.
- **PocketBase ids are 15-character strings**, not integers. `irshad_db.sql` is a
  2022 MySQL dump kept as a schema reference only — its rows are Faker
  placeholders, not migration data.
- **The API rules are the security boundary**, not the UI. Anything the portal
  can display, an anonymous `curl` can fetch.

## Documentation

| Document | What is in it |
|---|---|
| [CLAUDE.md](./CLAUDE.md) | Architecture, data model, i18n rules, conventions |
| [PLAN.md](./PLAN.md) | Phased build plan and what blocks each phase |
| [CHANGELOG.md](./CHANGELOG.md) | What has shipped |
| [docs/ADMIN.md](./docs/ADMIN.md) | How the admin works and what is deliberately not built |
| [specs/001-public-portal-ui/](./specs/001-public-portal-ui/) | Public portal spec, plan, research and data model |
| [.specify/memory/constitution.md](./.specify/memory/constitution.md) | Principles every plan is checked against |

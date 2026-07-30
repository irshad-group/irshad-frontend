# Admin dashboard

The staff CMS at `/{locale}/admin`. Built; the public site is not.

## Running it

```bash
nvm use                       # Node 22 (see .nvmrc)
cp .env.example .env.local    # fill in NEXT_PUBLIC_PB_URL and the admin credentials
npm install
npm run pb:types              # regenerate src/types/pb.ts from pocketbase/schema.json
npm run dev
```

Sign in at `/en/admin/login` with a `moderator` or `admin` account. A `user`-role
account is refused at the login form and 404s on every admin route.

## How it is put together

Rather than eighteen hand-written CRUD modules, one **registry** describes every
collection and the whole admin is generated from it:

```
src/lib/admin/registry.ts   field/column definitions per collection  ← edit this
src/lib/admin/schema.ts     Zod schemas + FormData parsing, built from the registry
src/lib/admin/actions.ts    Server Actions (the only client-callable server code)
src/lib/admin/data.ts       server-render-only read helpers
```

Adding a field is a one-line change in `registry.ts`; the list column, the form
input, the validation and the PocketBase payload all follow. Translatable fields
are declared once by base name — `title` expands to `title_en` / `title_ar` / `title_ku`.

Routes:

```
src/app/[locale]/(admin)/admin/
  (auth)/login/            unguarded, so the guard cannot lock you out of signing in
  (guarded)/layout.tsx     resolves the session, 404s non-staff
  (guarded)/page.tsx       dashboard + moderation queues
  (guarded)/[collection]/  list · new · [id] — generic across all 18 collections
```

## Authorization, in layers

1. **`src/proxy.ts`** — redirects to the login page when no auth cookie is present.
   It runs at the edge and can only check for the cookie's *presence*; it cannot
   verify the token or read a role.
2. **`(guarded)/layout.tsx`** — resolves the session against PocketBase and returns
   **404** (not 403) for anyone who is not staff, so the admin is not enumerable.
3. **PocketBase API rules** — the actual enforcement. Hiding a nav link or a button
   is presentation; the rules are what stop a hostile client.

Every Server Action re-checks the session, because a Server Action is a public HTTP
endpoint regardless of which component rendered the form.

`adminOnly` collections (`users`, `settings`, `provinces`) are hidden from the
moderator sidebar *and* 404 on direct navigation *and* refused by the API rules.

## Things worth knowing before you change something

- **Forms are controlled on purpose.** React 19 resets an uncontrolled form once its
  action resolves. With uncontrolled inputs, a validation failure wiped everything the
  editor had typed, and on the login form it emptied the email box so the browser's
  `required` check then blocked the retry with no visible cause. Do not "simplify" these
  back to `defaultValue`. `e2e/admin.mjs` has regression cases for both.
- **`actions.ts` must export only async functions.** Every export of a `'use server'`
  module is a callable HTTP endpoint. A stray non-async re-export silently stopped Next
  registering the other actions — the build still passed and the forms simply did
  nothing. Read helpers belong in `data.ts`.
- **Deletes mostly fail for moderators**, by design: the PocketBase rules restrict
  deletion to admins on most collections. The UI surfaces the server's refusal rather
  than guessing.
- **Relation labels come from `expand`.** If a column renders blank, the relation was
  either not expanded (`expand` on the collection def) or hidden from that role.

## Not built yet

- Rich-text fields are plain HTML textareas. A WYSIWYG editor was not in scope.
- Navigation is edited as a flat list with a `parent` picker and `sort_order`; there is
  no drag-and-drop reordering yet.
- Field labels in `registry.ts` are English only. The surrounding chrome is translated
  through next-intl; per-field labels would need ~300 message keys and were left for
  when someone actually asks.
- No bulk actions, no audit log, no image cropping.

## Tests

```bash
npm run build && npm start          # or npm run dev
npm run e2e:read                    # 44 checks: sessions, role gate, all 18 lists, RTL chrome
npm run e2e                         # 16 checks: sign-in, validation, create/update/delete
npm run pb:verify                   # 34 checks: the PocketBase API rules themselves
```

`e2e/admin.mjs` needs `BASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (and optionally
`MOD_EMAIL`, `CITIZEN_EMAIL`). It **writes to whichever PocketBase instance the app
points at** — development instances only. It cleans up what it creates.

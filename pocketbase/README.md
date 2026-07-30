# PocketBase schema and seed

The Irshad backend schema, derived from the legacy `irshad_db.sql` dump and applied
to the live PocketBase instance.

## Files

| Path | Purpose |
|---|---|
| `schema.json` | Snapshot of all 18 collections — fields, API rules, indexes. Importable through **Settings → Import collections** in the PocketBase admin UI, or via the MCP `import_collections` tool. |
| `seed/seed.mjs` | Creates the development dataset. Idempotent — re-running PATCHes existing records rather than duplicating them. |
| `seed/verify.mjs` | Exercises the API rules as an anonymous visitor, an end user, and a moderator. Run this after any rule change. |
| `seed/data-*.mjs` | The seed content itself, separated from the transport code. |

## Running

Both scripts read credentials from the environment. Node 18+ only, no dependencies.

```bash
export PB_URL=https://your-pocketbase-host
export PB_EMAIL=<superuser email>
export PB_PASSWORD=<superuser password>
export SEED_PASSWORD=<password to assign to the seeded accounts>

node pocketbase/seed/seed.mjs      # apply the dataset
node pocketbase/seed/verify.mjs    # assert the API rules hold
```

Both scripts exit non-zero if any of those four variables is missing, and `verify.mjs`
also exits non-zero if any check fails, so it can be wired into CI.

`SEED_PASSWORD` is deliberately **not** committed. The seeded set includes two
`admin`-role accounts, and this repository is public — a hardcoded value here would be a
working administrator login for whichever instance `PB_URL` points at. Keep it in your
local shell or `.env.local`, and never seed a production instance.

| Account | Role |
|---|---|
| `zaid.alrubaie@irshad.gov.iq`, `dilan.hussein@irshad.gov.iq` | `admin` |
| `noor.alsaadi@`, `rebin.ahmed@`, `huda.jassim@irshad.gov.iq` | `moderator` |
| `mustafa.kareem@`, `sara.abdullah@`, `aram.sabir@`, `layla.hashim@example.iq` | `user` |

## Authorization model

Authorization lives in the collection API rules, not in the UI. Three predicates recur:

- **Public** (`""`) — reference data anyone may read: `provinces`, `tags`, `settings`.
- **Staff** (`@request.auth.role = "admin" || @request.auth.role = "moderator"`) — content writes.
- **Admin only** (`@request.auth.role = "admin"`) — destructive deletes and geography.

Published-content collections gate reads on their own state, so unpublished rows are
invisible to the public without the UI having to filter:

```
(enabled = true && archived = false) || <staff>
```

`procedure_items` and `files` walk the relation to their parent
(`procedure.enabled = true && procedure.archived = false`), so archiving a procedure
withdraws its steps and its downloadable forms in the same action.

Two rules are worth knowing about because they are easy to break:

- **`users.updateRule`** contains `@request.body.role:isset = false`. Without it, any
  signed-in user could PATCH their own record and become an admin. `createRule` likewise
  pins `role` to `"user"` at signup.
- **`comments` / `reviews` createRule** requires `author = @request.auth.id && approved = false`,
  which blocks both impersonation and self-approval. Only staff can flip `approved`.

Note that a non-null list rule is applied by PocketBase as a **filter**, not as a gate:
a reader who fails it gets `200` with an empty result set, and `404` on a direct record
view. `verify.mjs` asserts on the returned rows rather than the status code for this reason.

## Constraint that rules cannot express

`comments`, `reviews` and `files` replace the legacy `dest_type` / `dest_id` pair with
separate nullable relations (`procedure`, `procedure_item`, `directorate`, `ministry`).
**Exactly one must be populated**, but PocketBase has no CHECK constraint, so this is not
enforced by the database. Enforce it in the Zod schema behind every Server Action that
writes to these three collections.

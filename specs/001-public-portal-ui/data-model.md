# Phase 1 Data Model: Collections → Routes

The schema is fixed and verified against the live instance; this feature adds no
collections and no fields. What follows maps what exists onto what the portal
reads.

## Route → query map

| Route | Reads | Notes |
|---|---|---|
| `/` | `slider`, `procedures` (featured, recent), `faq` (preview) | Static, revalidated |
| `/search?q=` | `procedures` | Per-request; filter across all six title/summary fields |
| `/procedures` | `procedures`, `tags` | Paginated; optional `?tag=` |
| `/procedures/[slug]` | `procedures` + expand `directorate`, `tags`; `procedure_items`; `files` | The core page |
| `/ministries` | `ministries` | `archived = false` enforced by API rule |
| `/ministries/[slug]` | `ministries`, `directorates` | Children listed |
| `/directorates/[slug]` | `directorates`, `directorate_branches` + expand `province`, `procedures` | Hours, contact, branches |
| `/faq` | `faq` | `enabled`, by `sort_order` |
| `/contact` | writes `contact` | Only public write in the portal |
| `/team`, `/partners` | `team`, `partners` | Ordered lists |
| shell | `navigation`, `settings` | Header menu and footer, cached hard |

## Relationships that shape the UI

```text
ministries ──< directorates ──< directorate_branches >── provinces
                     │
                     └──< procedures ──< procedure_items
                              │              │
                              ├──< files ────┘   (attached to either)
                              └──> tags (many-to-many)
```

A procedure belongs to exactly one directorate, which belongs to exactly one
ministry — so a procedure page can always name the responsible office, and a
breadcrumb up to the ministry is always available.

## Rules the UI must respect

- **Files are gated by their parent.** `files.listRule` requires
  `procedure.enabled = true && procedure.archived = false` (or the same through
  `procedure_item`). An unpublished procedure's attachments do not merely hide —
  they do not list. Pages must render an absent list as absent, not as an error.
- **Archived and disabled records are invisible anonymously.** `ministries`,
  `directorates`, `directorate_branches` and `procedures` filter on `archived`;
  `faq` filters on `enabled`. The portal never needs to filter these itself, and
  must not assume a record exists because a link pointed at it — a fetch
  returning nothing means `notFound()`.
- **`users` returns nothing to the public.** Confirmed against the live instance:
  0 items anonymously. Nothing in the portal may display an author name.
- **`comments` and `reviews` are out of scope** for this release pending the
  accounts clarification. They exist and are moderated, but no public route reads
  or writes them.
- **`contact` is create-only for the public.** A visitor can submit and cannot
  read back. `ip_address` and `user_agent` are hidden fields — the Server Action
  may populate them, but no page may display them.

## Field conventions the components rely on

- Translatable fields carry `_en` / `_ar` / `_ku` suffixes and are read only
  through `localized(record, field, locale)` — never by hardcoded suffix.
- Ordering is `sort_order` (integer) everywhere it exists; steps, FAQ, slider,
  branches and forms all rely on it.
- `slug` is single-valued, unique, and shared by all three languages.
- Ids are 15-character strings, never integers.
- Files are PocketBase file fields; URLs are built from the record and filename,
  not stored as paths.
- `fee_iqd` is a number in Iraqi dinars and needs locale-aware formatting,
  including Arabic-Indic digits where the locale calls for them.

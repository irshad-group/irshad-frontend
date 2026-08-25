# Scraped Iraqi government directory

`iraq-government-directory.json` — every federal and Kurdistan Region ministry, the
directorates under them, and the provincial branch offices under those, with the
contact details each source actually publishes.

Nothing here is hand-written content. Every field traces to one of the sources below,
and a record that no source could confirm carries `null` rather than a guess.

## What is in it

| Layer | Rows | Coords | Phone | Photo | Hours | Website | `title_en` | `title_ku` |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `ministries` | 42 | **42** | 22 | 35 | 7 | 42 | **42** | **42** |
| `directorates` | 362 | 270 | 81 | 197 | 26 | 222 | 159 | 42 |
| `branches` | 687 | **687** | 95 | 413 | 73 | 81 | 225 | 44 |
| `gis_locations` | 15 | 15 | — | 15 | — | — | — | — |

Logos: all 42 ministries (23 official federal marks from `ur.gov.iq`, 19 KRG entries
carrying the shared KRG emblem — see the gaps section).

42 ministries = **23 federal** + **19 Kurdistan Region**. The 19 governorate codes match
the `provinces` collection already in PocketBase, so no province rows are created.

## Sources

| Source | Used for | Notes |
|---|---|---|
| `gov.krd` entity pages (`/english/`, `/arabic/`, Kurdish root) | KRG ministry names in all three languages, official site URLs | The only place all three name sets appear together. Needs a full browser header set — a bare `curl` gets a 403. |
| `ar.wikipedia` + each ministry's own site | The 23 federal ministries and their names | Cross-checked against the ministry sites that were reachable. |
| `ur.gov.iq/api/public/orgs` | **Official federal ministry logos**, English and Kurdish names | The government's own portal registry (71 organisations). Images are only served from `/api/storage/...`; the bare `/storage/...` path returns the SPA shell. |
| `ur.gov.iq/api/public/gis` | 15 offices with government-published building photos | Small but authoritative, and the photos are government-owned rather than user-contributed. |
| Ministry websites (structure / departments pages) | Directorate **names** | 15 of 23 federal sites published a usable structure page. |
| **Google Maps** | Coordinates, phone, address, photo, website, rating, `title_en` / `title_ku` | The workhorse. Queried through the endpoint the Maps web app itself calls; responses are cached on disk so a re-run costs nothing. Re-querying with `hl=en` / `hl=ckb` returns the same place's name in that language — accepted only when the feature id matches, so it is provably the same place. |
| **OpenStreetMap** (Overpass) | `working_hours`, `name:en` / `name:ckb`, phone, website, email, and coordinates for records Maps could not place | 4,996 Iraqi government features. The only source with **full-week** opening hours. © OpenStreetMap contributors, ODbL. |

## How records were matched

Name matching across Arabic, Kurdish and English needs more than a string compare:

- **Normalisation** folds `أإآ→ا`, `ة→ه`, `ى/ی→ي`, `ئ→ي`, and strips tashkeel, so
  `وزارة` and `وزارە` compare equal.
- **Stop words** (`وزارة`, `دائرة`, `العامة`, `بغداد`, `ministry`, `general`, …) are
  removed before scoring, so a match has to agree on the *distinctive* part of the
  name and not just on the word "directorate".
- **A hard geographic gate**: a Kurdistan Region body below latitude 34.8 is rejected
  outright. Without it, a strong name match on "وزارة النقل" handed the KRG transport
  ministry the federal one's building in Baghdad.
- **Governorate bounding boxes** throw out branch results Maps placed in the wrong
  governorate.
- **`match_confidence`** on each directorate is the share of the requested name's
  distinctive words that appear in the matched place name. Below 0.5 the name is kept
  (the ministry published it) but the location is dropped — a wrong pin is worse than
  no pin.

## Known gaps

- **Opening hours cover 106 of 1,091 records.** Google Maps' search response carries
  only *today's* interval, never the week, and the place-detail route needs a session
  token this pipeline could not obtain. Every weekly schedule here therefore comes from
  OSM's `opening_hours`, which only 672 Iraqi government features carry. Nothing is
  inferred: Iraqi offices are overwhelmingly Sun–Thu 08:00–14:00, but writing that onto
  a record no source confirmed would send people to closed buildings.
- **Kurdish names are thin** — 128 of 1,091. This is a source limit, not a pipeline
  one: OSM tags only 281 Iraqi features with `name:ckb`, and Google Maps has few Sorani
  localisations. Kurmanji-Latin values were rejected rather than stored, because
  Irshad's `ku` locale renders Sorani.
- **The Endowments ministry has no Kurdish directorate names.** gov.krd publishes the
  list, but its Kurdish ordering does not match the English one and the alignment check
  refused it — see `recover-krg-names.mjs` below. Eight rows are Arabic + English only.
- **36 records list a Facebook page as their website.** That is genuinely what those
  bodies use as their public presence; it is not a scraping artefact.
- **KRG ministries share one logo.** `gov.krd` serves the same government-wide emblem
  on every ministry microsite; per-ministry marks are not published there. The record
  says so in `_sources.logo`.
- **Five federal ministry domains are dead** — `moedu`, `mowr`, `mocul`, `zeraa`,
  `epedu` all 301 to a parked `securegateway.com` gateway, from this network *and*
  from an unrelated one, so it is the domains and not a local block. Their directorates
  came from curated candidates, each verified against Maps before being kept.
- **85 directorates have a name but no coordinates.** The OSM and retry passes brought
  this down from 99 to 70, and then `drop-ambiguous.mjs` deliberately put 15 back —
  see below.
- **15 directorates are named only by an internal function** — "الدائرة القانونية",
  "دائرة المحاسبة", "Directorate of Administration", "الدائرة القانونية مكتب المدير
  العام". Every ministry has one, so the name identifies the record only within its
  parent, and a global place search cannot resolve it. It did not: six different
  ministries' legal departments matched **private law firms** (`legalhand.co`,
  `blog.legaloffice-iq.com`), "Directorate of Administration" matched a public
  administration institute, and "Directorate of Media" matched the cross-government
  media department.

  For these rows every field a place lookup contributed is withdrawn — coordinates,
  phone, photo, address, place id, **and** the name and website where those came off
  the match rather than off the ministry's own site. Provenance is tracked per field
  (`_website_source`, `_title_en_source`, `_title_ku_source`) precisely so the two can
  be told apart: the Ministry of Finance legal department keeps
  `mof.gov.iq/LegalDepartment.aspx` because the ministry published that link itself.
  The names and ministry links are real and remain; the rows are flagged
  `_ambiguous_name`.
- Branch coverage is only as good as Maps' own coverage, which is thin outside the
  large cities. `customs` (3) and `companies-registration` (5) are genuinely sparse.

## Regenerating

The scrapers sit in this directory. Run them from here, in order:

```bash
# build
node enrich-ministries.mjs      # -> ministries-enriched.json
node discover-directorates.mjs  # -> directorates-discovered.json
node clean-directorates.mjs     # -> directorates-clean.json
node enrich-directorates.mjs    # -> directorates-enriched.json
node discover-branches.mjs      # -> branches-discovered.json
node build-dataset.mjs          # -> iraq-government-directory.json

# then refine, in this order (each rewrites that file in place)
node enrich-osm.mjs             # working_hours, name:en / name:ckb, phone, email
node locate-missing.mjs         # place records that still have no coordinates
node enrich-names.mjs           # title_en / title_ku from localised Maps queries
node normalize-names.mjs        # enforce the right script in each name field
node recover-krg-names.mjs      # Arabic + Kurdish names from gov.krd's own lists
node drop-ambiguous.mjs         # withdraw locations a generic name could not have earned
```

The chain is deterministic and every network response is cached, so re-running it
reproduces the same file.

`osm-gov.json` is the Overpass download the OSM passes read; `osm-query.txt` is the
query that produced it. Re-run it to refresh:

```bash
curl -s --max-time 300 -X POST --data-urlencode "data@osm-query.txt" https://overpass-api.de/api/interpreter -o osm-gov.json
```

Shared modules: `gmaps.mjs` (Maps client + on-disk cache + concurrency pool),
`fetch.mjs` (HTTP with DoH fallback and browser headers), `match.mjs` (Arabic/Kurdish
normalisation and scoring), `osm.mjs` (Overpass loader, `opening_hours` parser,
proximity matching). Inputs: `seed-ministries.json` (the 42 ministries),
`seed-gap-directorates.json` (candidates for ministries whose site is unreachable),
`branch-families.json` (which directorates run a provincial network).

`pb.txt` is the Google Maps request template captured from a real browser session. If
Maps starts returning empty results, that template has gone stale: open Maps in a
browser, search anything, and copy the `pb=` parameter off the `search?tbm=map` request.

Responses are cached in `cache-gmaps/` and `cache-http/` (gitignored) — delete those to
force a genuinely fresh scrape.

## Two checks worth understanding

Both exist because a plausible-looking wrong value is more damaging here than a missing
one, and both refuse rather than guess.

**`recover-krg-names.mjs`** — 27 KRG directorates were harvested from gov.krd's English
microsites and had no Arabic name. gov.krd publishes the same "Organisation" list in
Arabic and Kurdish, usually in the same order — but not always. On the Endowments
ministry the Kurdish list puts Garmian where English has Hajj and Umrah, so aligning by
position would have labelled the Hajj directorate "Garmian", silently and plausibly.

Position is therefore only a proposal. It is accepted for a ministry only when every
item carrying a recognisable anchor — a governorate name, or a distinctive topic like
Hajj / Yazidi / Martyrs — agrees at the same index on both sides. Seven of the eight
ministry-language pairs passed; the Endowments Kurdish list was rejected outright and
those names left empty. Where the check passes, gov.krd's English list also replaces
any English name a place lookup had supplied, which is what corrected the Endowments
directorate in Erbil from "Erbil General Directorate of Health".

**`drop-ambiguous.mjs`** — see the note on ambiguous names above. Its Arabic word list
is matched by *stem*, not exact form: the same function appears as "الدائرة القانونية"
and "مديرية القانوني", and behind a proclitic as "للخدمات". Matching exact forms caught
the first spelling of each and missed the rest. A name containing a governorate is never
treated as generic — the place is what makes it findable.

## Importing

```bash
# 1. add the fields the dataset needs that the schema does not yet have
node pocketbase/migrations/001-geography-contact-fields.mjs --dry-run
node pocketbase/migrations/001-geography-contact-fields.mjs

# 2. metadata only (fast)
node pocketbase/seed/import-geography.mjs \
  --data pocketbase/seed/scraped/iraq-government-directory.json --dry-run

# 3. with logos and building photos (slow — fetches and uploads every image)
node pocketbase/seed/import-geography.mjs \
  --data pocketbase/seed/scraped/iraq-government-directory.json --files
```

All three read `PB_URL`, `PB_EMAIL`, `PB_PASSWORD` from the environment.

The import **upserts by slug and never deletes**. That matters: the development seed's
directorates already have `procedures` attached, and replacing those rows would orphan
every procedure pointing at one. 13 of the 18 seeded directorates are matched by slug
and updated in place; the other 5 are left untouched.

Fields prefixed `_` are provenance for review and are dropped on import:
`_sources`, `_verified`, `_confidence`, `_maps_name`, `_osm` (matched OSM feature,
distance and name similarity), `_located_by` (which pass placed a late-located record),
`_title_ar_needs_translation`.

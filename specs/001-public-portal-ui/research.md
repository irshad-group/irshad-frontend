# Phase 0 Research: Public Portal UI/UX

Decisions taken before any route is written, with the alternatives that were
considered and why they lost.

## 1. Typeface with real Arabic and Kurdish coverage

**Decision**: self-host one open-source family covering Latin and Arabic script,
subset and served as `woff2` with `font-display: swap` and preloaded for the
active locale. Candidates to evaluate: **IBM Plex Sans Arabic**, **Noto Sans
Arabic**, **Vazirmatn**.

**Why it matters**: Kurdish Sorani uses letters outside the common Arabic set —
ڕ ڵ ۆ ێ گ چ پ ژ. A family that "supports Arabic" may lack these, and the browser
then substitutes a different face for individual letters inside a word. The
result looks broken to a Kurdish reader while appearing fine to everyone else, so
it will not be caught by casual review.

**Verification before committing** (this is a gate, not a formality): render a
Kurdish specimen containing every one of those letters, at body and heading
sizes, and confirm each is drawn by the chosen family rather than a fallback —
checked in the browser's font inspector, not by eye alone.

**Rejected**: Google Fonts CDN — an extra origin on a slow connection, a
third-party request from every visitor, and no privacy benefit for a government
service. Rejected: separate Latin and Arabic families — two families drift in
weight and x-height, and the seam shows in mixed-script sentences, which are
common here.

## 2. Search over three languages

**Decision**: query PocketBase directly with a filter across the six title and
summary fields (`title_en`, `title_ar`, `title_ku`, `summary_*`) using the `~`
contains operator, executed server-side in a Server Component, paginated.

**Why**: search must return results from a URL — `/ar/search?q=…` — so the page
is shareable, crawlable, and works without JavaScript. Searching every language's
fields rather than only the active one means a visitor who knows a term in Arabic
still finds the record while reading in Kurdish.

**Rejected**: a client-side index (Fuse.js, Pagefind) — it ships the entire
corpus to a phone on 3G to answer a query the server can answer, and it breaks
without JavaScript. Rejected: an external search service — another dependency and
another origin for a corpus of a few hundred records.

**Known limitation to accept**: `~` is a substring match, not stemming or fuzzy
matching. For a corpus this size that is adequate; if it stops being adequate,
the fix is a search index, not a bigger filter string.

## 3. Rendering and freshness

**Decision**: content pages are statically rendered with `generateStaticParams`
over published slugs and revalidated on a time interval. Search results render
per request, since the query is unbounded.

**Why**: content changes rarely — a procedure's steps are stable for months —
while readers are many and their connections are slow. Static HTML from cache is
the single largest performance lever available, and it is what makes SC-003
reachable.

**Rejected**: per-request fetching everywhere — needless load on PocketBase and a
slower page for no editorial benefit. **Open**: on-demand revalidation would be
better than a timer, but it needs the admin to signal the frontend after a save;
that is a follow-up, not a blocker, and the timer is correct in the meantime.

## 4. Branch locations on a map

**Decision**: **default to no third-party embed.** Render the address as text,
plus a link that opens the coordinates in the visitor's own maps application.
Optionally a static, self-hosted image where one exists.

**Why**: an embedded map is typically the heaviest thing on a page and sends
every visitor's IP address to a third party before they have chosen to use it.
For a government service whose users may be sensitive about being profiled, that
is a real cost for a feature most visitors do not need. A link costs nothing and
does the same job for the people who want it.

**This remains an open question for the service owner** — it is recorded in the
spec as a clarification because the privacy trade-off is theirs to make, not
ours. If an embed is required, it should be click-to-load so nothing is requested
until the visitor asks.

## 5. Bidirectional layout

**Decision**: logical properties only (`margin-inline-start`, `padding-inline-end`,
`start-0`, `text-start`); no physical `left`/`right` in any public component. One
stylesheet serves both directions; there is no RTL override sheet.

**Handling mixed content**: procedure titles and body text routinely mix Arabic
or Kurdish with Latin words and Western digits, where the bidirectional algorithm
can reorder a line confusingly. Content that comes from PocketBase is rendered
with `dir="auto"` on its container so the first strong character decides
direction, and isolated inline fragments are wrapped so they cannot leak
direction into their surroundings.

**Existing debt**: the admin was built before this rule was enforced, so the
audit for physical properties covers the shared stylesheet and primitives, not
only new code.

## 6. Visual language

**Decision**: a small system, not a per-page composition — one typeface at a
five-step scale, the existing deep green (`#1b5e4b`) as the single accent, a
neutral ink ramp already defined in `globals.css`, generous line height for
Arabic and Kurdish, and three shared layout primitives (page header, card,
list row) used by every route.

**Why**: "modern" here means legible and quiet. The content is bureaucratic
instructions that people read while stressed; the interface should get out of the
way. A small system also survives translation, because nothing depends on a
string being a particular length.

**Constraint carried from the constitution**: colour never carries meaning alone
— published/archived, KRG/federal and translation status all need a text or shape
cue as well.

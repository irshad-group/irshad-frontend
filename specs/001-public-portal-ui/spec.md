# Feature Specification: Public Portal UI/UX

**Feature Branch**: `001-public-portal-ui`

**Created**: 2026-08-04

**Status**: Draft

**Input**: User description: "Create a simple modern UI/UX for this backend"

## Context

The backend is complete and populated: 18 PocketBase collections holding 14
ministries, 18 directorates, 12 provincial branches, 19 provinces, 15 procedures
with 66 ordered steps, 16 downloadable forms, 20 tags, and FAQ, slider, team,
partners, navigation and settings content — all trilingual. The staff admin that
maintains it is built and working.

Nothing citizen-facing reads any of it. `(public)` is a placeholder page plus the
language switcher. This feature is the portal itself: the interface a citizen
actually uses to find out how to complete a government procedure.

"Simple and modern" is read here as plain language, generous type, few controls
per screen, and speed on a weak connection — not visual novelty. The measure of
success is a citizen finishing a task, not the interface being admired.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find out how to complete a procedure (Priority: P1)

A citizen needs to renew a passport. They arrive at the home page, type
"passport" into the search box or pick it from a list of common procedures, and
open its page. There they see, in their own language: what the procedure is, the
numbered steps in order, which documents to bring, the fee, how long it takes,
and any forms they can download in advance.

**Why this priority**: This is the reason the site exists. Every other screen
exists to deliver a citizen to this one. Shipped alone, it is already a useful
public service.

**Independent Test**: Open a procedure's URL directly in each of the three
languages and confirm that title, description, ordered steps, fee, processing
time and downloadable forms all render, with no missing-translation blanks.

**Acceptance Scenarios**:

1. **Given** a published procedure with six ordered steps, **When** a visitor
   opens its page, **Then** all six appear in `sort_order`, numbered, each with
   its own description.
2. **Given** a procedure with two attached forms, **When** the page renders,
   **Then** each form is listed with its title and a download link showing file
   type and size.
3. **Given** a procedure whose Kurdish description is empty, **When** a visitor
   reads it in Kurdish, **Then** the English text is shown rather than a blank
   space, and the fallback is not silently presented as Kurdish.
4. **Given** a visitor searching "passport" in Arabic, **When** results return,
   **Then** matching procedures appear with their Arabic titles.
5. **Given** an archived or unpublished procedure, **When** its URL is requested
   directly, **Then** the site returns 404 rather than partial content.

---

### User Story 2 - Find the office that handles it (Priority: P2)

Having read the steps, the citizen needs to know where to go. From the procedure
they reach the directorate responsible, and from there the branch in their own
province — with address, working hours, phone, and a map location.

**Why this priority**: Knowing the steps without knowing where to present
yourself leaves the task unfinished. It depends on P1 existing but adds
independent value.

**Independent Test**: Open a directorate page, confirm its branches list, filter
to one province, and confirm address, hours and contact details render.

**Acceptance Scenarios**:

1. **Given** a procedure belonging to a directorate, **When** its page renders,
   **Then** the responsible directorate is named and linked.
2. **Given** a directorate with branches in several provinces, **When** a visitor
   selects their province, **Then** only that province's branches are shown.
3. **Given** a branch with coordinates, **When** its page renders, **Then** the
   location is shown on a map and as a text address.
4. **Given** a branch with no coordinates, **When** its page renders, **Then**
   the address is shown alone with no broken map frame.

---

### User Story 3 - Browse by institution (Priority: P3)

A citizen who does not know the name of the procedure browses instead: ministries
→ a ministry's directorates → the procedures that directorate offers.

**Why this priority**: A fallback path for people who cannot name what they need.
Valuable, but search and tags serve most visitors faster.

**Independent Test**: Walk ministries index → ministry detail → directorate
detail → procedure, confirming each level lists its children.

**Acceptance Scenarios**:

1. **Given** the ministries index, **When** it renders, **Then** each ministry
   shows its name and logo, and Kurdistan Regional Government bodies are
   distinguishable from federal ones.
2. **Given** a ministry with directorates, **When** its page renders, **Then**
   its directorates are listed and linked.
3. **Given** an archived ministry, **When** the index renders, **Then** it does
   not appear.

---

### User Story 4 - Get answers and make contact (Priority: P4)

The citizen checks the FAQ for a general question, and if the site does not
answer it, sends a message through the contact form.

**Why this priority**: Reduces load on staff and gives a route out when the
content falls short — but only after the content itself is worth reading.

**Independent Test**: Expand FAQ entries; submit the contact form and confirm the
message reaches the `contact` collection and the visitor sees confirmation.

**Acceptance Scenarios**:

1. **Given** the FAQ page, **When** a visitor expands a question, **Then** its
   answer is revealed, and the control is operable by keyboard.
2. **Given** a completed contact form, **When** it is submitted, **Then** a
   record is created and the visitor is told it was received.
3. **Given** a submission missing a required field, **When** submitted, **Then**
   the error names the field, in the active language, and nothing is lost from
   the form.

---

### Edge Cases

- A content field is empty in the requested language — the fallback chain must
  produce text, and the reader should not be misled about which language they are
  reading.
- A translated string is far longer than its English equivalent, or a single
  unbroken word (a long URL, a ministry's full formal name) overflows its
  container.
- Arabic or Kurdish text sits next to Latin text or digits inside one sentence,
  where bidirectional reordering can scramble the result.
- Kurdish-specific letters (ڕ ڵ ۆ ێ گ چ پ ژ) fall back to a substitute face and
  render visibly differently from the surrounding text.
- A ministry has no logo, a procedure has no forms, a directorate has no branches
  — every list can legitimately be empty.
- Search returns nothing; the visitor needs a route onward, not a dead end.
- The connection is slow enough that images arrive after text, and the layout
  must not jump when they do.
- JavaScript fails or is disabled: navigation, reading and language switching must
  still work.
- A procedure is archived between the page being cached and the visitor arriving.

## Requirements *(mandatory)*

### Functional Requirements

**Procedure — the core**

- **FR-001**: The site MUST present a procedure's title, summary, description,
  ordered steps, fee, processing time and tags in the visitor's active language.
- **FR-002**: Steps MUST render in `sort_order`, visibly numbered.
- **FR-003**: Attached forms MUST be listed with title and download link, showing
  file type and size before download; a form may instead be an external link.
- **FR-004**: A procedure MUST link to the directorate responsible for it.
- **FR-005**: Procedures that are unpublished or archived MUST NOT be reachable,
  and MUST return 404 rather than an empty page.

**Finding things**

- **FR-006**: Visitors MUST be able to search procedures by text in any of the
  three languages and receive results in the active language.
- **FR-007**: Visitors MUST be able to filter or browse procedures by tag.
- **FR-008**: A search with no results MUST offer a way onward — popular
  procedures, browsing by ministry, or contacting staff.
- **FR-009**: The home page MUST surface the slider, featured and recent
  procedures, and a preview of the FAQ.

**Institutions and places**

- **FR-010**: The site MUST provide index and detail pages for ministries and for
  directorates, each listing what belongs to it.
- **FR-011**: A directorate MUST show working hours, contact details and its
  provincial branches.
- **FR-012**: Branches MUST be filterable by province, with 19 governorates
  available.
- **FR-013**: Where coordinates exist, a location MUST be shown on a map; where
  they do not, the page MUST render cleanly without one.

**Support**

- **FR-014**: The FAQ MUST render enabled entries in `sort_order` as
  keyboard-operable expandable items.
- **FR-015**: The contact form MUST validate input, create a `contact` record,
  confirm receipt, and preserve what the visitor typed if validation fails.
- **FR-016**: Static pages for team and partners MUST render from their
  collections.

**Language, structure and shell**

- **FR-017**: Every page MUST be reachable at `/en/…`, `/ar/…` and `/ku/…`, with
  the language switcher preserving the current path.
- **FR-018**: Text direction MUST follow the active locale, and layout MUST use
  logical properties so one stylesheet serves both directions.
- **FR-019**: Missing translations MUST fall back — requested language, English,
  first non-empty — and never render blank.
- **FR-020**: The header menu and footer MUST be driven by the `navigation`
  collection and `settings`, not hardcoded, so staff can change them without a
  deployment.
- **FR-021**: Every page MUST expose a title, description and language
  alternates for search engines and link previews.

**Quality of the interface**

- **FR-022**: All content and navigation MUST be usable by keyboard alone, with a
  visible focus indicator and a skip-to-content link.
- **FR-023**: The layout MUST work from a 320 px viewport upward without
  horizontal scrolling.
- **FR-024**: Reading content and moving between pages MUST work without
  client-side JavaScript.
- **FR-025**: The typeface MUST cover Arabic and Kurdish Sorani, with Kurdish
  letters rendering in the same face as the surrounding text.

### Key Entities

- **Procedure**: What a citizen wants to accomplish. Title, summary, rich
  description, fee, processing time, publish date, `featured`, `enabled`,
  `archived`; belongs to a directorate; carries tags, ordered steps and forms.
- **Procedure item**: One numbered step of a procedure, ordered and translatable.
- **File**: A downloadable form or an external link, attached to a procedure or a
  step; publicly visible only while its parent procedure is published.
- **Ministry**: A government body, federal or Kurdistan Regional Government;
  parent of directorates.
- **Directorate**: The office that actually delivers procedures; has working
  hours, contact details, location and branches.
- **Directorate branch**: A provincial office of a directorate, tied to a
  province, with its own address and coordinates.
- **Province**: One of Iraq's 19 governorates; the unit citizens use to find their
  nearest office.
- **Tag**: A cross-cutting label grouping procedures across ministries.
- **FAQ, slider, team, partners**: Supporting content, ordered and toggleable.
- **Navigation & settings**: Staff-controlled menu structure and site-wide contact
  details.
- **Contact message**: An inbound enquiry; created by the public, read by staff.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A citizen who knows what they want can reach the relevant procedure
  page from the home page in **3 interactions or fewer**.
- **SC-002**: **90%** of test participants, given a plain-language task ("find out
  how to renew a passport and what to bring"), complete it unaided on first
  attempt.
- **SC-003**: Every page achieves **Largest Contentful Paint under 2.5 s** and
  **Cumulative Layout Shift under 0.1** on a simulated 3G connection and a
  mid-range phone.
- **SC-004**: Every page passes automated **WCAG 2.2 AA** checks with zero
  violations, and the whole portal is operable by keyboard alone.
- **SC-005**: All screens render correctly in all three languages at 320 px and
  1280 px, with no clipped, overflowing or mis-ordered bidirectional text.
- **SC-006**: With JavaScript disabled, a visitor can still read every content
  page, navigate between pages, and switch language.
- **SC-007**: No page ever displays an empty region where a missing translation
  should be — verified against records deliberately left untranslated.
- **SC-008**: Unpublished and archived records are unreachable from every public
  route, verified as an anonymous client.

## Assumptions

- The visitor is on a mobile phone over a slow connection, and may be reading in
  a second language. Design decisions resolve in that person's favour.
- Content is authored by staff in the existing admin; this feature adds no
  editing capability.
- The public portal reads PocketBase **anonymously**. Nothing on it requires
  credentials, and the API rules already make published content world-readable.
- Slugs stay single-valued and shared across languages, so a page's URL differs
  between languages only in the locale segment.
- The 19 provinces are fixed reference data, not user-editable content.
- Content volume stays in the current range (tens of ministries, hundreds of
  procedures), so listing pages need pagination but not faceted search
  infrastructure.
- The existing brand colour in `globals.css` (deep green `#1b5e4b`) is the
  starting palette unless a brand guide says otherwise.

## Clarifications Needed

- **[NEEDS CLARIFICATION: Are citizen accounts in scope for this release?]** The
  schema supports comments and reviews from signed-in users, and the API rules
  hold them for staff moderation. Adding sign-up, sign-in and moderated
  submission is a substantial expansion, and a public sign-up on a government
  service carries obligations that read-only pages do not. This spec assumes
  **read-only, no accounts**.
- **[NEEDS CLARIFICATION: Is there an official brand — logo, palette, typeface —
  this must follow?]** A government portal usually inherits one. Without it, the
  existing green and a self-hosted trilingual typeface will be chosen on design
  grounds alone, and rework is likely if a guide surfaces later.
- **[NEEDS CLARIFICATION: Which map provider may be used for branch locations?]**
  Coordinates exist for offices. An embedded third-party map sends every
  visitor's IP to that provider and adds significant page weight; a static image
  or a plain "open in maps" link avoids both. Privacy and weight argue against an
  embed, but the choice belongs to the service owner.

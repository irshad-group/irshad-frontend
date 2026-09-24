/**
 * The pure half of search — shared by the server-rendered results page and the
 * browser-side suggestion list.
 *
 * This lives here rather than in `lib/pb/queries/public.ts` because that module
 * is `server-only`: importing it from a Client Component is a build error. The
 * filter string itself has no server dependency, so both callers can share one
 * definition instead of drifting apart.
 */

/** The title and summary fields a procedure search covers. */
export const PROCEDURE_SEARCH_FIELDS = [
  'title_en',
  'title_ar',
  'title_ku',
  'summary_en',
  'summary_ar',
  'summary_ku',
] as const;

/**
 * Build a PocketBase filter matching `term` against every field in `fields`.
 *
 * Searching all three languages rather than only the active locale means
 * someone who knows a term in Arabic still finds the record while reading in
 * Kurdish. `~` is a substring match — no stemming, no fuzziness — which is
 * adequate for a corpus of this size. If it stops being adequate the answer is
 * a search index, not a longer filter.
 *
 * The term is passed through `JSON.stringify`, so a quote or backslash typed
 * into the box is escaped rather than closing the filter's string literal.
 */
export function searchFilter(term: string, fields: readonly string[]): string {
  const trimmed = term.trim();
  if (!trimmed) return '';
  const quoted = JSON.stringify(`%${trimmed}%`);
  return fields.map((field) => `${field} ~ ${quoted}`).join(' || ');
}

/**
 * How many characters to wait for before asking the server anything.
 *
 * One character matches most of the corpus and teaches the reader nothing,
 * while costing a round trip on a connection that may not have one to spare.
 */
export const SUGGEST_MIN_CHARS = 2;

/** How many suggestions to show. Longer lists are scrolled, not read. */
export const SUGGEST_LIMIT = 6;

/**
 * Whether a term is worth a suggestion request.
 *
 * Counts by code point, so a two-letter Kurdish or Arabic word is not rejected
 * for being two *units* long when a surrogate pair is involved.
 */
export function shouldSuggest(term: string): boolean {
  return [...term.trim()].length >= SUGGEST_MIN_CHARS;
}

/**
 * Split `text` around the first case-insensitive occurrence of `term`.
 *
 * Returns the three pieces rather than markup so the caller decides how to
 * emphasise the match — and so this stays testable without a DOM. When the
 * term is absent (the record matched on another language's field, which is the
 * whole point of searching all six) the whole string comes back as `before`.
 */
export function highlightParts(
  text: string,
  term: string,
): { before: string; match: string; after: string } {
  const needle = term.trim();
  if (!needle) return { before: text, match: '', after: '' };

  const at = text.toLocaleLowerCase().indexOf(needle.toLocaleLowerCase());
  if (at === -1) return { before: text, match: '', after: '' };

  return {
    before: text.slice(0, at),
    match: text.slice(at, at + needle.length),
    after: text.slice(at + needle.length),
  };
}

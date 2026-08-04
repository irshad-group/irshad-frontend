import type { FilesRecord } from '@/types/pb';

/**
 * Format a fee in Iraqi dinars.
 *
 * Digits stay **Latin in all three languages**, matching how Iraqi government
 * forms print fees and reference numbers — a citizen comparing the figure on
 * screen with the one on a printed schedule should see the same shapes. The
 * grouping separator is forced to the Latin numbering system for the same
 * reason, rather than following the locale's default.
 *
 * Returns `null` when there is no fee to show, which the caller renders as
 * "free" wording from the message catalogue rather than as "0". A procedure
 * with no fee recorded and one that is genuinely free are indistinguishable in
 * the schema, so both are treated as free — the alternative is showing nothing,
 * which is worse for someone budgeting a trip to an office.
 */
export function formatFee(fee: number | undefined | null, locale: string): string | null {
  if (fee === undefined || fee === null || Number.isNaN(fee) || fee <= 0) return null;
  return new Intl.NumberFormat(numberLocale(locale), { maximumFractionDigits: 0 }).format(fee);
}

/**
 * A BCP 47 tag `Intl` will accept, forcing Latin digits.
 *
 * The locale reaching this is the first path segment, which is not always one
 * of ours: a request for `/favicon.ico` renders with `locale` set to
 * `favicon.ico`, and `new Intl.NumberFormat('favicon.ico-u-nu-latn')` throws a
 * RangeError that takes the whole page down. Found in the server log while
 * debugging something else.
 *
 * An unusable tag falls back to English formatting rather than throwing —
 * grouping a number is never worth losing the page over.
 */
function numberLocale(locale: string): string {
  const tag = `${locale}-u-nu-latn`;
  try {
    return Intl.NumberFormat.supportedLocalesOf(tag).length > 0 ? tag : 'en-u-nu-latn';
  } catch {
    return 'en-u-nu-latn';
  }
}

export type AttachedFile = {
  kind: 'download' | 'link';
  href: string;
  /** Upper-case extension for display, e.g. `PDF`. Empty when it cannot be told. */
  extension: string;
};

/**
 * Work out what an attached file actually is.
 *
 * The schema allows an uploaded `document`, an `external_url`, both, or neither
 * — nothing in PocketBase enforces exactly one. An upload wins when both are
 * present: it is served from our own origin, so it cannot rot or redirect
 * somewhere unexpected. Neither present returns `null` and the caller omits the
 * row rather than rendering a link to nowhere.
 */
export function attachedFile(
  file: Pick<FilesRecord, 'document' | 'external_url'>,
  fileUrl: string | null,
): AttachedFile | null {
  if (file.document && fileUrl) {
    return { kind: 'download', href: fileUrl, extension: extensionOf(file.document) };
  }
  const external = file.external_url?.trim();
  if (external) {
    return { kind: 'link', href: external, extension: '' };
  }
  return null;
}

function extensionOf(filename: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(filename);
  return match ? match[1]!.toUpperCase() : '';
}

/**
 * How many procedures carry each tag.
 *
 * Counted in memory from one read of the procedures rather than one count query
 * per tag: there are twenty tags and a few dozen procedures, so twenty round
 * trips to save a little arithmetic would be a poor trade.
 *
 * A tag listed twice on the same procedure counts once — the relation is a set,
 * and a duplicate is a data-entry slip, not two procedures.
 *
 * Only tags that actually appear are keys here. A tag with no procedures is
 * absent rather than zero, so the caller decides whether to show it.
 */
export function countByTag(procedures: readonly { tags?: string[] }[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const procedure of procedures) {
    for (const tag of new Set(procedure.tags ?? [])) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return counts;
}

export type ListParams = { q: string; tag: string; page: number };

/**
 * Normalise the query string behind a listing page.
 *
 * These values arrive from the URL, so they are attacker-controlled and may be
 * repeated, blank, negative or not numbers at all. Everything is coerced to
 * something safe to hand to PocketBase: a page below 1 becomes 1, a page that
 * is not a number becomes 1, and repeated parameters take the first value.
 */
export function parseListParams(
  params: Record<string, string | string[] | undefined>,
): ListParams {
  const first = (value: string | string[] | undefined): string =>
    (Array.isArray(value) ? (value[0] ?? '') : (value ?? '')).trim();

  const page = Number.parseInt(first(params.page), 10);

  return {
    q: first(params.q),
    tag: first(params.tag),
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

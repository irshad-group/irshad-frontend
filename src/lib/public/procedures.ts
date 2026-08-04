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
  return new Intl.NumberFormat(`${locale}-u-nu-latn`, { maximumFractionDigits: 0 }).format(fee);
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

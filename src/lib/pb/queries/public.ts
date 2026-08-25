import 'server-only';

import PocketBase, { type RecordListOptions } from 'pocketbase';
import type { BaseRecord, CollectionName, CollectionRecords } from '@/types/pb';
import { PB_URL } from '../server';

/**
 * Every read the citizen-facing portal makes.
 *
 * Deliberately separate from `lib/pb/collections.ts`, which goes through
 * `pbServer()` and therefore calls `cookies()`. Touching `cookies()` opts a
 * route out of static rendering for the whole request, so using it on a public
 * page would quietly turn a cacheable page into a per-request render and cost
 * us the performance budget the portal is designed around.
 *
 * These helpers use an anonymous instance instead: no cookie, no session, no
 * dynamic API. What comes back is exactly what any visitor can see, because
 * PocketBase's API rules — not this module — decide it. Unpublished and
 * archived records are already invisible here, so callers never filter for
 * `enabled` or `archived` themselves; an empty result means "not public", and
 * the page should call `notFound()`.
 */

/**
 * How long a public page may serve cached content before re-rendering.
 *
 * Content changes rarely — a procedure's steps are stable for months — and
 * readers are many and slow-connected, so an hour of staleness buys a large
 * amount of speed.
 *
 * Route segments must inline the number — `export const revalidate = 3600` —
 * because Next reads segment config by static analysis at build time and fails
 * the build outright on an imported constant. This export documents the value;
 * keep those literals in step with it.
 *
 * On-demand revalidation triggered by the admin would be better and is a
 * follow-up; this is correct in the meantime.
 */
export const PUBLIC_REVALIDATE = 3600;

/** An anonymous instance. Never carries auth state, so it is safe to build per call. */
function pbPublic(): PocketBase {
  const pb = new PocketBase(PB_URL);
  // Next renders sibling components concurrently; PocketBase's auto-cancellation
  // would abort one request because another with the same key started.
  pb.autoCancellation(false);
  return pb;
}

export type PublicList<C extends CollectionName> = {
  items: CollectionRecords[C][];
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
};

export async function listPublic<C extends CollectionName>(
  collection: C,
  options: RecordListOptions & { page?: number; perPage?: number } = {},
): Promise<PublicList<C>> {
  const { page = 1, perPage = 24, ...rest } = options;
  const result = await pbPublic().collection(collection).getList(page, perPage, rest);
  return result as unknown as PublicList<C>;
}

export async function listAllPublic<C extends CollectionName>(
  collection: C,
  options: RecordListOptions = {},
): Promise<CollectionRecords[C][]> {
  const items = await pbPublic().collection(collection).getFullList(options);
  return items as unknown as CollectionRecords[C][];
}

/**
 * Fetch one record by its slug.
 *
 * Returns `null` rather than throwing when nothing matches — which covers both
 * "no such record" and "exists but is not public", two cases the portal must
 * treat identically so that an archived record cannot be distinguished from a
 * missing one by probing.
 */
export async function findPublicBySlug<C extends CollectionName>(
  collection: C,
  slug: string,
  options: RecordListOptions = {},
): Promise<CollectionRecords[C] | null> {
  try {
    const record = await pbPublic()
      .collection(collection)
      .getFirstListItem(`slug = ${JSON.stringify(slug)}`, options);
    return record as unknown as CollectionRecords[C];
  } catch {
    return null;
  }
}

/** Slugs for `generateStaticParams` — only what is publicly visible. */
export async function publicSlugs(collection: CollectionName): Promise<string[]> {
  const items = await listAllPublic(collection, { fields: 'slug' });
  return items.map((item) => (item as { slug?: string }).slug).filter((s): s is string => !!s);
}

/**
 * URL for a file stored on a record.
 *
 * PocketBase serves files at /api/files/<collection>/<record>/<filename>; the
 * schema stores the filename only, never a path. `thumb` requests one of the
 * sizes declared on the field (for example `120x120` on a ministry logo) — ask
 * for one wherever a full-size image is not needed, since these are the
 * heaviest thing on a listing page.
 */
export function fileUrl(
  record: Pick<BaseRecord, 'collectionId' | 'id'>,
  filename: string | undefined,
  options: { thumb?: string } = {},
): string | null {
  if (!filename) return null;
  const url = `${PB_URL}/api/files/${record.collectionId}/${record.id}/${encodeURIComponent(filename)}`;
  return options.thumb ? `${url}?thumb=${encodeURIComponent(options.thumb)}` : url;
}

/**
 * The search filter now lives in `lib/public/search.ts` and is re-exported
 * here so existing server callers keep their import path.
 *
 * It moved because this module is `server-only`, and the browser-side
 * suggestion list needs the same filter. One definition, two callers, rather
 * than a copy in a Client Component that quietly drifts out of step with the
 * results page it is supposed to preview.
 */
export { PROCEDURE_SEARCH_FIELDS, searchFilter } from '@/lib/public/search';

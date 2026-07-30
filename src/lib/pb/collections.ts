import 'server-only';

import type { RecordListOptions } from 'pocketbase';
import type { CollectionName, CollectionRecords } from '@/types/pb';
import { pbServer } from './server';

/**
 * Typed accessors over the PocketBase record API.
 *
 * These run as the signed-in user, so PocketBase's API rules decide what comes
 * back. A staff-only collection returns an empty list for a visitor rather than
 * throwing — the rules are the enforcement, not these helpers.
 */

export type ListResult<C extends CollectionName> = {
  items: CollectionRecords[C][];
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
};

export async function listRecords<C extends CollectionName>(
  collection: C,
  options: RecordListOptions & { page?: number; perPage?: number } = {},
): Promise<ListResult<C>> {
  const { page = 1, perPage = 30, ...rest } = options;
  const pb = await pbServer();
  const result = await pb.collection(collection).getList(page, perPage, rest);
  return result as unknown as ListResult<C>;
}

export async function listAll<C extends CollectionName>(
  collection: C,
  options: RecordListOptions = {},
): Promise<CollectionRecords[C][]> {
  const pb = await pbServer();
  const items = await pb.collection(collection).getFullList(options);
  return items as unknown as CollectionRecords[C][];
}

export async function getRecord<C extends CollectionName>(
  collection: C,
  id: string,
  options: RecordListOptions = {},
): Promise<CollectionRecords[C] | null> {
  const pb = await pbServer();
  try {
    const record = await pb.collection(collection).getOne(id, options);
    return record as unknown as CollectionRecords[C];
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

export async function countRecords(collection: CollectionName, filter?: string): Promise<number> {
  const pb = await pbServer();
  const result = await pb
    .collection(collection)
    .getList(1, 1, { filter, skipTotal: false, fields: 'id' });
  return result.totalItems;
}

/**
 * PocketBase returns 404 both for a missing record and for one hidden by an API
 * rule. Callers should treat the two identically — that is the point of the
 * rule, and distinguishing them would leak existence.
 */
export function isNotFound(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && error.status === 404;
}

/** Extracts PocketBase's per-field validation messages into a flat record. */
export function fieldErrors(error: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (typeof error !== 'object' || error === null) return out;
  const response = (error as { response?: { data?: Record<string, { message?: string }> } }).response;
  for (const [field, detail] of Object.entries(response?.data ?? {})) {
    if (detail?.message) out[field] = detail.message;
  }
  return out;
}

import 'server-only';

import { pbServer } from '@/lib/pb/server';
import { getSessionUser, isStaff } from '@/lib/auth';

/**
 * Read helpers for the admin screens.
 *
 * Deliberately NOT in `actions.ts`: every export of a `'use server'` module is
 * reachable as an HTTP endpoint by anyone, whereas these are only ever called
 * during a server render.
 */

export type RelationOption = { id: string; label: string };

/** Options for a relation picker — the target's id plus a human-readable label. */
export async function relationOptions(
  collection: string,
  labelField: string,
): Promise<RelationOption[]> {
  const user = await getSessionUser();
  if (!isStaff(user)) return [];

  const pb = await pbServer();
  const items = await pb.collection(collection).getFullList({
    sort: labelField,
    fields: `id,${labelField}`,
  });
  return items.map((item) => ({
    id: item.id,
    label: String((item as Record<string, unknown>)[labelField] ?? item.id),
  }));
}

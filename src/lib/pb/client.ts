'use client';

import PocketBase from 'pocketbase';

export const PB_URL = process.env.NEXT_PUBLIC_PB_URL ?? '';

/**
 * Browser-side PocketBase instance.
 *
 * A module-level singleton is correct *here* and only here: in the browser there
 * is exactly one user per JavaScript context. Never mirror this pattern on the
 * server — see `lib/pb/server.ts` for why.
 */
let instance: PocketBase | null = null;

export function pbClient(): PocketBase {
  if (!instance) {
    instance = new PocketBase(PB_URL);
    instance.autoCancellation(false);
  }
  return instance;
}

/** Public URL for a file stored on a record, optionally as a thumbnail. */
export function fileUrl(
  record: { id: string; collectionId: string; collectionName?: string },
  filename: string,
  thumb?: string,
): string {
  if (!filename) return '';
  const base = `${PB_URL}/api/files/${record.collectionId}/${record.id}/${filename}`;
  return thumb ? `${base}?thumb=${thumb}` : base;
}

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { THUMBS, thumbSize, type ThumbName } from './thumbs';

/**
 * The schema snapshot is the record of what the live instance declares, and
 * `pb:types` regenerates it after every schema change. Reading it here is what
 * makes this test worth having: a size added to `THUMBS` without a matching
 * PocketBase migration fails, instead of silently serving full-size images.
 */
type FileField = { name: string; type: string; thumbs?: string[] };
type Collection = { name: string; fields?: FileField[]; schema?: FileField[] };

const snapshot = JSON.parse(readFileSync('pocketbase/schema.json', 'utf8')) as
  { collections?: Collection[] } | Collection[];
const collections: Collection[] = Array.isArray(snapshot) ? snapshot : (snapshot.collections ?? []);

function declaredThumbs(collection: string, field: string): string[] | null {
  const col = collections.find((c) => c.name === collection);
  if (!col) return null;
  const found = (col.fields ?? col.schema ?? []).find((f) => f.name === field && f.type === 'file');
  return found ? (found.thumbs ?? []) : null;
}

describe('THUMBS', () => {
  const names = Object.keys(THUMBS) as ThumbName[];

  it.each(names)('%s names a file field that exists', (name) => {
    const { collection, field } = THUMBS[name];
    expect(declaredThumbs(collection, field), `${collection}.${field} is not a file field`).not.toBeNull();
  });

  it.each(names)('%s asks for a size PocketBase declares', (name) => {
    const { collection, field, size } = THUMBS[name];
    // The failure this exists to catch: PocketBase serves the ORIGINAL for an
    // undeclared size rather than refusing, so nothing downstream notices.
    expect(declaredThumbs(collection, field) ?? []).toContain(size);
  });

  it('exposes the size for a name', () => {
    expect(thumbSize('officeCard')).toBe('224x160');
  });
});

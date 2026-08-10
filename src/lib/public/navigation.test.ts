import { describe, expect, it } from 'vitest';
import type { NavigationRecord } from '@/types/pb';
import { buildNavTree } from './navigation';

function nav(overrides: Partial<NavigationRecord> & { id: string }): NavigationRecord {
  return {
    created: '',
    updated: '',
    collectionId: 'nav',
    collectionName: 'navigation',
    title_en: overrides.id,
    title_ar: '',
    title_ku: '',
    endpoint: '/',
    placement: 'menu',
    enabled: true,
    ...overrides,
  } as NavigationRecord;
}

describe('buildNavTree', () => {
  it('returns an empty array when there is nothing to show', () => {
    expect(buildNavTree([], 'menu')).toEqual([]);
  });

  it('keeps only the requested placement', () => {
    const tree = buildNavTree([nav({ id: 'a' }), nav({ id: 'b', placement: 'drawer' })], 'menu');
    expect(tree.map((n) => n.id)).toEqual(['a']);
  });

  it('orders roots by sort_order rather than input order', () => {
    const tree = buildNavTree(
      [nav({ id: 'c', sort_order: 3 }), nav({ id: 'a', sort_order: 1 }), nav({ id: 'b', sort_order: 2 })],
      'menu',
    );
    expect(tree.map((n) => n.id)).toEqual(['a', 'b', 'c']);
  });

  it('treats a missing sort_order as 0 so it sorts first, not last', () => {
    const tree = buildNavTree([nav({ id: 'first' }), nav({ id: 'second', sort_order: 1 })], 'menu');
    expect(tree.map((n) => n.id)).toEqual(['first', 'second']);
  });

  it('nests children under their parent and sorts them too', () => {
    const tree = buildNavTree(
      [
        nav({ id: 'parent', sort_order: 1 }),
        nav({ id: 'child-b', parent: 'parent', sort_order: 3 }),
        nav({ id: 'child-a', parent: 'parent', sort_order: 2 }),
      ],
      'menu',
    );
    expect(tree).toHaveLength(1);
    expect(tree[0]!.children.map((n) => n.id)).toEqual(['child-a', 'child-b']);
  });

  it('nests to more than one level', () => {
    const tree = buildNavTree(
      [nav({ id: 'a' }), nav({ id: 'b', parent: 'a' }), nav({ id: 'c', parent: 'b' })],
      'menu',
    );
    expect(tree[0]!.children[0]!.children[0]!.id).toBe('c');
  });

  it('drops disabled entries', () => {
    const tree = buildNavTree([nav({ id: 'a' }), nav({ id: 'off', enabled: false })], 'menu');
    expect(tree.map((n) => n.id)).toEqual(['a']);
  });

  it('drops the children of a disabled parent instead of promoting them', () => {
    const tree = buildNavTree(
      [nav({ id: 'off', enabled: false }), nav({ id: 'child', parent: 'off' })],
      'menu',
    );
    // The child survives as a root — it must not vanish — but the disabled
    // parent is gone, so the branch is not resurfaced beneath it.
    expect(tree.map((n) => n.id)).toEqual(['child']);
    expect(tree[0]!.children).toEqual([]);
  });

  it('promotes an entry whose parent is in another placement', () => {
    const tree = buildNavTree(
      [nav({ id: 'a' }), nav({ id: 'orphan', parent: 'elsewhere' })],
      'menu',
    );
    expect(tree.map((n) => n.id).sort()).toEqual(['a', 'orphan']);
  });

  it('promotes an entry that is its own parent rather than looping', () => {
    const tree = buildNavTree([nav({ id: 'self', parent: 'self' })], 'menu');
    expect(tree.map((n) => n.id)).toEqual(['self']);
    expect(tree[0]!.children).toEqual([]);
  });

  it('promotes both entries of a two-node cycle', () => {
    const tree = buildNavTree(
      [nav({ id: 'a', parent: 'b', sort_order: 1 }), nav({ id: 'b', parent: 'a', sort_order: 2 })],
      'menu',
    );
    expect(tree.map((n) => n.id)).toEqual(['a', 'b']);
  });

  it('breaks a longer cycle', () => {
    const tree = buildNavTree(
      [
        nav({ id: 'a', parent: 'c', sort_order: 1 }),
        nav({ id: 'b', parent: 'a', sort_order: 2 }),
        nav({ id: 'c', parent: 'b', sort_order: 3 }),
      ],
      'menu',
    );
    expect(tree).toHaveLength(3);
  });

  it('does not mutate the records it was given', () => {
    const input = [nav({ id: 'a' }), nav({ id: 'b', parent: 'a' })];
    const snapshot = JSON.parse(JSON.stringify(input));
    buildNavTree(input, 'menu');
    expect(input).toEqual(snapshot);
  });

  it('builds the drawer independently of the menu', () => {
    const items = [
      nav({ id: 'm', placement: 'menu', sort_order: 1 }),
      nav({ id: 'd1', placement: 'drawer', sort_order: 2 }),
      nav({ id: 'd2', placement: 'drawer', parent: 'd1', sort_order: 3 }),
    ];
    const drawer = buildNavTree(items, 'drawer');
    expect(drawer.map((n) => n.id)).toEqual(['d1']);
    expect(drawer[0]!.children.map((n) => n.id)).toEqual(['d2']);
  });
});

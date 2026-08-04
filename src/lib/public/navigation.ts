import type { NavigationRecord } from '@/types/pb';

/** A navigation entry with its children attached. */
export type NavNode = NavigationRecord & { children: NavNode[] };

/**
 * Build the nested menu for one placement.
 *
 * The `navigation` collection is flat: entries carry a `placement`
 * (`menu` | `drawer`), a `sort_order`, and an optional self-relation `parent`.
 * Staff control all three from the admin, so this has to survive input no
 * developer chose:
 *
 * - An entry whose parent sits in the *other* placement, or has been deleted,
 *   would otherwise vanish from the menu entirely. It is promoted to a root
 *   instead — a misplaced link is recoverable, a disappeared one is not.
 * - An entry can be made its own parent, or two entries can point at each
 *   other. Left alone that is an infinite loop at render time, so any entry
 *   whose ancestry cycles is promoted to a root as well.
 *
 * Disabled entries are dropped, including their children: hiding a parent must
 * hide the branch beneath it, or the children resurface as top-level links.
 */
export function buildNavTree(
  items: readonly NavigationRecord[],
  placement: 'menu' | 'drawer',
): NavNode[] {
  const scoped = items.filter((item) => item.placement === placement && item.enabled !== false);

  const byId = new Map<string, NavigationRecord>(scoped.map((item) => [item.id, item]));
  const nodes = new Map<string, NavNode>(scoped.map((item) => [item.id, { ...item, children: [] }]));

  /**
   * Does following `parent` upwards from `startId` come back to it?
   * Also catches an entry that is its own parent, since the first hop lands
   * straight back on the id already seen.
   */
  const cycles = (startId: string, parentId: string): boolean => {
    const seen = new Set<string>([startId]);
    let current = byId.get(parentId);
    while (current) {
      if (seen.has(current.id)) return true;
      seen.add(current.id);
      current = current.parent ? byId.get(current.parent) : undefined;
    }
    return false;
  };

  const roots: NavNode[] = [];
  for (const item of scoped) {
    const node = nodes.get(item.id)!;
    const parentId = item.parent;
    if (parentId) {
      const parent = nodes.get(parentId);
      if (parent && !cycles(item.id, parentId)) {
        parent.children.push(node);
        continue;
      }
    }
    roots.push(node);
  }

  const bySortOrder = (a: NavNode, b: NavNode) => (a.sort_order ?? 0) - (b.sort_order ?? 0);
  const sortDeep = (list: NavNode[]): NavNode[] => {
    list.sort(bySortOrder);
    for (const node of list) sortDeep(node.children);
    return list;
  };

  return sortDeep(roots);
}

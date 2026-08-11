/**
 * Pure data shaping for the home page. Everything here is fed by the public
 * queries and rendered by server components; keeping the logic separate makes
 * it unit-testable without touching PocketBase.
 */

/**
 * Count procedures per ministry, walking procedure → directorate → ministry.
 *
 * PocketBase has no aggregation, and the corpus is small enough that counting
 * over the full list at build time is cheaper than N per-ministry queries.
 */
export function proceduresPerMinistry(
  procedures: readonly { directorate?: string }[],
  directorates: readonly { id: string; ministry?: string }[],
): Map<string, number> {
  const ministryOf = new Map<string, string>();
  for (const d of directorates) {
    if (d.ministry) ministryOf.set(d.id, d.ministry);
  }
  const counts = new Map<string, number>();
  for (const p of procedures) {
    const ministry = p.directorate ? ministryOf.get(p.directorate) : undefined;
    if (ministry) counts.set(ministry, (counts.get(ministry) ?? 0) + 1);
  }
  return counts;
}

/** Count records per value of a relation field (branches per province, steps per procedure). */
export function countByField<K extends string>(
  items: readonly Partial<Record<K, string>>[],
  field: K,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const value = item[field];
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

/**
 * The step-progress dots on a procedure card: `total` segments, the first
 * `steps` of them filled. More steps than segments just fills the row — the
 * exact count is written next to it, the dots only sketch the weight.
 */
export function stepDots(steps: number, total = 6): boolean[] {
  const filled = Math.max(0, Math.min(total, Math.floor(steps)));
  return Array.from({ length: total }, (_, i) => i < filled);
}

import type { DirectorateBranchesRecord, ProvincesRecord } from '@/types/pb';

/**
 * A Waze link for a set of coordinates, rather than an embedded map.
 *
 * Still a link, never an embed: an embed is typically the heaviest thing on a
 * page and hands every visitor's IP to a third party before they have asked for
 * a map. A link costs nothing until someone chooses to follow it, which is the
 * property that matters on a government service.
 *
 * `waze.com/ul` is the documented universal link: it opens the Waze app when it
 * is installed — which on an Iraqi phone it very often is, Waze being the
 * common way to navigate here — and falls back to Waze's web map otherwise, so
 * it also works for someone at a desk. `navigate=yes` starts routing rather
 * than dropping the visitor on a map they then have to act on, since anyone
 * following this link is trying to reach an office.
 *
 * `geo:` was rejected for the same reason as before: desktop browsers mostly
 * ignore it.
 *
 * Returns `null` unless both coordinates are present and inside the valid
 * range, so a record with one coordinate, a zero placeholder, or a swapped pair
 * renders as a plain address instead of pointing someone at the wrong place.
 * Being sent to the middle of the ocean is worse than being given no map.
 */
export function mapsLink(
  lat: number | undefined | null,
  lon: number | undefined | null,
): string | null {
  if (!isCoordinate(lat, -90, 90) || !isCoordinate(lon, -180, 180)) return null;
  // 0,0 is Null Island — in this dataset it means "not filled in".
  if (lat === 0 && lon === 0) return null;
  return `https://www.waze.com/ul?ll=${lat}%2C${lon}&navigate=yes&zoom=17`;
}

function isCoordinate(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

export type BranchWithProvince = DirectorateBranchesRecord & {
  expand?: { province?: ProvincesRecord };
};

export type ProvinceGroup = {
  /** `null` when the branch has no province expanded — it is still listed. */
  province: ProvincesRecord | null;
  branches: BranchWithProvince[];
};

/**
 * Group branches by province for display.
 *
 * Province order follows the provinces' own `sort_order`, not the order
 * branches happen to arrive in, so the list reads the same on every page. A
 * branch whose province relation is missing or could not be expanded is
 * collected into a trailing group rather than dropped: a citizen looking for an
 * office should still see it exists, even when its province is unset.
 */
export function groupBranchesByProvince(branches: readonly BranchWithProvince[]): ProvinceGroup[] {
  // Typed with a non-null province: orphans never enter this map, they are
  // appended after the sort, so nothing here needs to guard against null.
  const groups = new Map<string, { province: ProvincesRecord; branches: BranchWithProvince[] }>();
  const orphans: BranchWithProvince[] = [];

  for (const branch of branches) {
    const province = branch.expand?.province;
    if (!province) {
      orphans.push(branch);
      continue;
    }
    const existing = groups.get(province.id);
    if (existing) existing.branches.push(branch);
    else groups.set(province.id, { province, branches: [branch] });
  }

  const ordered: ProvinceGroup[] = [...groups.values()].sort(
    (a, b) => (a.province.sort_order ?? 0) - (b.province.sort_order ?? 0),
  );

  if (orphans.length > 0) ordered.push({ province: null, branches: orphans });
  return ordered;
}

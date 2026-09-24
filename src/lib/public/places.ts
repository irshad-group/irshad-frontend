import type { DirectorateBranchesRecord, ProvincesRecord } from '@/types/pb';

/**
 * A link that opens turn-by-turn navigation to these coordinates in Waze.
 *
 * Waze is what people here actually drive with, so "open in maps" should hand
 * the office over to it rather than to a map the reader then has to re-enter
 * somewhere else. `waze.com/ul` is the documented universal link: on a phone
 * with the app it opens the app, and everywhere else it opens Waze Live Map in
 * the browser, so a reader on a laptop is not sent to a dead end.
 *
 * `navigate=yes` starts routing straight away — someone tapping this on the
 * street wants directions, not a pin to look at. The map already on the page
 * is there for looking.
 *
 * `geo:` was rejected for the same reason as before: desktop browsers mostly
 * ignore it, and this has to work for someone on a laptop in an office as well
 * as a phone in the street.
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
  if (!usable(lat, lon)) return null;
  return `https://www.waze.com/ul?ll=${lat}%2C${lon}&navigate=yes`;
}

/**
 * The Waze live map, framed on an office's page with a pin on the office.
 *
 * Same coordinate rules as `mapsLink`, through the same guard, so the map and
 * the link beneath it can never disagree about whether a location is usable:
 * one coordinate, a swapped pair or the 0,0 placeholder gives no map at all,
 * because a map of the wrong place is worse than none.
 *
 * `lang` sets the language of Waze's own controls — its search box and
 * buttons — to match the page. Waze has no Kurdish, and asked for it (`ckb` or
 * `ku`) it silently answers in English; Kurdish readers get Arabic instead,
 * which is the portal's fallback for missing Kurdish everywhere else too.
 */
export function wazeEmbedUrl(
  lat: number | undefined | null,
  lon: number | undefined | null,
  locale: string,
): string | null {
  if (!usable(lat, lon)) return null;
  const lang = locale === 'en' ? 'en' : 'ar';
  return `https://embed.waze.com/iframe?zoom=16&lat=${lat}&lon=${lon}&ct=livemap&pin=1&lang=${lang}`;
}

function usable(
  lat: number | undefined | null,
  lon: number | undefined | null,
): lat is number {
  if (!isCoordinate(lat, -90, 90) || !isCoordinate(lon, -180, 180)) return false;
  // 0,0 is Null Island — in this dataset it means "not filled in".
  return !(lat === 0 && lon === 0);
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

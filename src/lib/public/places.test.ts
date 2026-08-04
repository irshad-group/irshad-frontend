import { describe, expect, it } from 'vitest';
import type { DirectorateBranchesRecord, ProvincesRecord } from '@/types/pb';
import { groupBranchesByProvince, mapsLink, type BranchWithProvince } from './places';

describe('mapsLink', () => {
  it('builds a link for valid coordinates', () => {
    const link = mapsLink(33.3152, 44.3661);
    expect(link).toContain('mlat=33.3152');
    expect(link).toContain('mlon=44.3661');
  });

  it('accepts the extremes of the valid range', () => {
    expect(mapsLink(-90, -180)).not.toBeNull();
    expect(mapsLink(90, 180)).not.toBeNull();
  });

  it('rejects a missing coordinate rather than guessing', () => {
    expect(mapsLink(undefined, 44.3)).toBeNull();
    expect(mapsLink(33.3, undefined)).toBeNull();
    expect(mapsLink(null, null)).toBeNull();
    expect(mapsLink(undefined, undefined)).toBeNull();
  });

  it('rejects out-of-range values', () => {
    // A swapped pair puts an Iraqi longitude in the latitude slot.
    expect(mapsLink(444.3661, 33.3152)).toBeNull();
    expect(mapsLink(-91, 0)).toBeNull();
    expect(mapsLink(0, 181)).toBeNull();
    expect(mapsLink(0, -181)).toBeNull();
  });

  it('rejects values that are not finite numbers', () => {
    expect(mapsLink(Number.NaN, 44)).toBeNull();
    expect(mapsLink(33, Number.POSITIVE_INFINITY)).toBeNull();
    expect(mapsLink('33.3' as unknown as number, 44)).toBeNull();
  });

  it('treats 0,0 as unset rather than Null Island', () => {
    expect(mapsLink(0, 0)).toBeNull();
  });

  it('keeps a legitimate zero on one axis', () => {
    expect(mapsLink(0, 44.3661)).not.toBeNull();
    expect(mapsLink(33.3152, 0)).not.toBeNull();
  });
});

function province(id: string, sort: number): ProvincesRecord {
  return {
    id,
    created: '',
    updated: '',
    collectionId: 'prv',
    collectionName: 'provinces',
    code: id,
    name_en: id,
    name_ar: '',
    name_ku: '',
    krg: false,
    sort_order: sort,
  } as ProvincesRecord;
}

function branch(id: string, prov?: ProvincesRecord): BranchWithProvince {
  return {
    id,
    created: '',
    updated: '',
    collectionId: 'brn',
    collectionName: 'directorate_branches',
    title_en: id,
    title_ar: '',
    title_ku: '',
    ...(prov ? { province: prov.id, expand: { province: prov } } : {}),
  } as unknown as DirectorateBranchesRecord as BranchWithProvince;
}

describe('groupBranchesByProvince', () => {
  const baghdad = province('baghdad', 1);
  const basra = province('basra', 2);

  it('returns nothing for an empty list', () => {
    expect(groupBranchesByProvince([])).toEqual([]);
  });

  it('groups branches under their province', () => {
    const groups = groupBranchesByProvince([
      branch('a', baghdad),
      branch('b', basra),
      branch('c', baghdad),
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0]!.province?.id).toBe('baghdad');
    expect(groups[0]!.branches.map((b) => b.id)).toEqual(['a', 'c']);
  });

  it("orders groups by the province's own sort_order, not arrival order", () => {
    const groups = groupBranchesByProvince([branch('b', basra), branch('a', baghdad)]);
    expect(groups.map((g) => g.province?.id)).toEqual(['baghdad', 'basra']);
  });

  it('treats a missing sort_order as 0', () => {
    const unsorted = { ...province('erbil', 0), sort_order: undefined } as ProvincesRecord;
    const groups = groupBranchesByProvince([branch('a', basra), branch('b', unsorted)]);
    expect(groups.map((g) => g.province?.id)).toEqual(['erbil', 'basra']);
  });

  it('copes when neither province has a sort_order', () => {
    // Staff can leave `sort_order` empty on every province; the comparison must
    // still be well defined rather than producing NaN.
    const a = { ...province('anbar', 0), sort_order: undefined } as ProvincesRecord;
    const b = { ...province('duhok', 0), sort_order: undefined } as ProvincesRecord;
    const groups = groupBranchesByProvince([branch('1', a), branch('2', b)]);
    expect(groups.map((g) => g.province?.id)).toEqual(['anbar', 'duhok']);
  });

  it('keeps a branch whose province is not expanded, in a trailing group', () => {
    const groups = groupBranchesByProvince([branch('orphan'), branch('a', baghdad)]);
    expect(groups).toHaveLength(2);
    expect(groups[0]!.province?.id).toBe('baghdad');
    expect(groups[1]!.province).toBeNull();
    expect(groups[1]!.branches.map((b) => b.id)).toEqual(['orphan']);
  });

  it('collects several unexpanded branches into one group', () => {
    const groups = groupBranchesByProvince([branch('x'), branch('y')]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.branches).toHaveLength(2);
  });

  it('does not mutate the input', () => {
    const input = [branch('a', baghdad), branch('b', basra)];
    const snapshot = JSON.parse(JSON.stringify(input));
    groupBranchesByProvince(input);
    expect(input).toEqual(snapshot);
  });
});

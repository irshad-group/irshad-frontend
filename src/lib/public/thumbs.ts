/**
 * The PocketBase thumbnail sizes this app is allowed to ask for.
 *
 * PocketBase generates a thumbnail only for a size declared on the file field.
 * Ask for anything else and it does not error, does not warn, and does not
 * resize — it returns the original, with `?thumb=` still in the URL. A
 * directorate page asking for `320x0`, which nothing declared, was serving 21
 * full-size photographs into 112x80 boxes: 2.75 MB of images on a page that
 * needs about 60 kB of them.
 *
 * So the sizes live here, each tied to the field it belongs to, and
 * `thumbs.test.ts` checks every one against `pocketbase/schema.json`. Adding a
 * size to this table without declaring it in PocketBase fails the test rather
 * than quietly shipping full-size images.
 */
export type ThumbSpec = {
  /** The collection whose file field serves it. */
  collection: string;
  /** The file field on that collection. */
  field: string;
  /** PocketBase thumb size, exactly as declared on the field. */
  size: string;
};

export const THUMBS = {
  /** Ministry mark in a list row or a home-page grid, drawn at 40–48px. */
  ministryLogo: { collection: 'ministries', field: 'logo', size: '120x120' },
  /** Ministry mark on its own page, drawn at 80–96px. */
  ministryLogoLarge: { collection: 'ministries', field: 'logo', size: '300x300' },
  /** The building banner on a ministry page — the source `next/image` resizes from. */
  ministryBanner: { collection: 'ministries', field: 'photos', size: '1200x0' },
  /** A provincial office's photo on a directorate page, drawn at 112x80. */
  officeCard: { collection: 'directorate_branches', field: 'photos', size: '224x160' },
  /** A directorate's own building photo, shown full width on a procedure page. */
  directoratePhoto: { collection: 'directorates', field: 'photos', size: '800x0' },
  /** Partner mark, drawn at 48px. */
  partnerLogo: { collection: 'partners', field: 'logo', size: '240x120' },
  /** Team portrait, drawn at 96px. */
  teamPhoto: { collection: 'team', field: 'photo', size: '200x200' },
} as const satisfies Record<string, ThumbSpec>;

export type ThumbName = keyof typeof THUMBS;

/** The size string for a named thumbnail, for passing to `fileUrl`. */
export const thumbSize = (name: ThumbName): string => THUMBS[name].size;

/**
 * Ask Google for the full-size photo rather than the thumbnail it hands back.
 *
 * Maps' photo URLs end in a size directive — `=w114-h86-k-no` — and the search
 * response only ever contains thumbnails. Stored as-is, every building photo on
 * the site was a 4 kB, 114-pixel-wide postage stamp: fine in a list, useless the
 * moment anyone opened one. Rewriting the directive returns the real photograph,
 * 1600 pixels wide, from the same URL.
 *
 * Shared rather than inlined because more than one pass assigns a photo — the
 * build, and the pass that goes back to Maps for records it could not place —
 * and the first version of this lived in only one of them, which left twelve
 * directorates still showing thumbnails.
 */
export const largePhoto = (url) => (url && /googleusercontent\.com/.test(url)
  ? url.replace(/=[^=/]*$/, '=w1600-h1200-k-no')
  : url) || null;

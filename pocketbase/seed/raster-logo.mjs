import sharp from 'sharp';

/** Longest edge of a rasterised logo. Displayed at 40–96 px; 512 covers a 4x screen. */
export const LOGO_SIZE = 512;

/**
 * Rasterise an SVG logo to PNG, leaving every other format alone.
 *
 * SVG looks like the right choice for a logo and is the wrong one here. Neither
 * of the two things that shrink an image can touch it: PocketBase's `?thumb=`
 * does nothing to a vector, and `next/image` refuses to optimise SVG and
 * redirects to the original file instead. So a 44 kB coat of arms was
 * downloaded in full to be drawn at 40 px — and the ministries index, which
 * lists nineteen of them, spent 836 kB on icons.
 *
 * As PNG the same logo goes through both: PocketBase can thumbnail it and
 * `next/image` serves a ~2 kB WebP at the size actually rendered. 512 px is
 * far more than the 96 px the largest use needs, so nothing visible is lost by
 * giving up the vector.
 *
 * Returns `null` when the buffer is not an SVG, meaning "use it unchanged" —
 * callers should not have to know which formats need this.
 */
export async function rasterizeLogo(buffer, contentType = '') {
  const looksSvg = /svg/i.test(contentType) || /^\s*(<\?xml|<svg)/i.test(buffer.subarray(0, 200).toString('utf8'));
  if (!looksSvg) return null;

  // `density` is what the SVG is rendered at before resizing; the default 72dpi
  // renders a small nominal viewBox into a blurry bitmap.
  const png = await sharp(buffer, { density: 300 })
    .resize(LOGO_SIZE, LOGO_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  return { buffer: png, type: 'image/png', ext: 'png' };
}

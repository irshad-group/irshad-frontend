// Turning an Arabic name into a URL slug, shared by every pass that creates a
// record. PocketBase's `slug` fields only accept `[a-z0-9-]`, so an Arabic slug
// is rejected outright — which is how this ended up in its own module: the
// ministry-site pass grew its own slugify, kept the Arabic letters, and the
// import failed at the first new directorate.
import { stripTashkeel } from './match.mjs';

/** Very small Arabic -> Latin map, only good enough to make a readable URL slug. */
export function translit(ar) {
  const M = {
    'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h',
    'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd',
    'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm',
    'ن': 'n', 'ه': 'h', 'ة': 'a', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ئ': 'y', 'ؤ': 'w', 'ء': '',
    'ﻻ': 'la',
  };
  return stripTashkeel(ar).split('')
    .map((c) => (M[c] !== undefined ? M[c] : (/[a-zA-Z0-9]/.test(c) ? c : ' ')))
    .join('')
    .replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    .slice(0, 60);
}

/** Latin text -> slug, or `fallback` when nothing usable survives. */
export const slugify = (s, fallback) => {
  const base = (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return base || fallback;
};

/** An Arabic name straight to a slug PocketBase will accept. */
export const slugFromArabic = (ar, fallback) => slugify(translit(ar), fallback);

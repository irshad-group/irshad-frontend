// Fourth pass: fill title_en and title_ku from Google Maps' own localisations.
//
// Maps returns place names in the requested interface language, so re-running a
// query with hl=en / hl=ckb yields the English and Kurdish names for the very same
// place. The result is accepted only when the returned feature id matches the id
// already stored on the record — that makes it the same place by construction,
// rather than a same-sounding one nearby.
import fs from 'node:fs';
import path from 'node:path';
import { search, pool } from './gmaps.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const IN = process.argv[2] || path.join(HERE, 'iraq-government-directory.json');
const ds = JSON.parse(fs.readFileSync(IN, 'utf8'));
const minBySlug = Object.fromEntries(ds.ministries.map((m) => [m.slug, m]));
const provAr = Object.fromEntries((ds.branches || []).map((b) => [b.province_code, b.province_ar]));

const clean = (s) => (s ? String(s).replace(/\s+/g, ' ').trim() : null);
const looksLatin = (s) => /[A-Za-z]/.test(s) && (s.match(/[A-Za-z]/g) || []).length >= s.length * 0.4;
const looksKurdish = (s) => /[ڕڵۆێگچپژڤکھەیڎ]/.test(s);

function whereOf(rec) {
  if (rec.province_code && provAr[rec.province_code]) return provAr[rec.province_code];
  const krg = rec.krg ?? !!minBySlug[rec.ministry_slug]?.krg;
  return krg ? 'اربيل' : 'بغداد';
}

const targets = [...ds.ministries, ...ds.directorates, ...ds.branches]
  .filter((r) => r.place_id && (!r.title_en || !r.title_ku));
console.log(`records missing an English or Kurdish name (and with a place id): ${targets.length}`);

let done = 0;
const stats = { en: 0, ku: 0, hit: 0 };

await pool(targets, 6, async (r) => {
  const q = `${r.title_ar} ${whereOf(r)}`;
  for (const [lang, field, accept] of [['en', 'title_en', looksLatin], ['ckb', 'title_ku', looksKurdish]]) {
    if (r[field]) continue;
    let hits = [];
    try { hits = await search(q, { lang }); } catch (e) { hits = []; }
    const same = hits.find((p) => p.ftid && p.ftid === r.place_id);
    if (!same || !same.name) continue;
    stats.hit += 1;
    const name = clean(same.name);
    // Maps falls back to the Arabic name when it has no localisation; only take a
    // value that is actually in the language we asked for.
    if (!accept(name)) continue;
    r[field] = name;
    r[`_${field}_source`] = 'place-match';
    stats[lang === 'en' ? 'en' : 'ku'] += 1;
  }
  done += 1;
  if (done % 50 === 0) console.log(`  ... ${done}/${targets.length}  (en +${stats.en}, ku +${stats.ku})`);
});

fs.writeFileSync(IN, JSON.stringify(ds, null, 2));

console.log(`\nfilled: title_en +${stats.en}, title_ku +${stats.ku}`);
console.log('totals now:');
for (const [name, rows] of [['ministries', ds.ministries], ['directorates', ds.directorates], ['branches', ds.branches]]) {
  console.log(`  ${name.padEnd(13)} ar ${String(rows.filter((r) => r.title_ar).length).padStart(3)}`
    + `  en ${String(rows.filter((r) => r.title_en).length).padStart(3)}`
    + `  ku ${String(rows.filter((r) => r.title_ku).length).padStart(3)}`
    + `  of ${rows.length}`);
}

// Fifth pass: make each name field actually hold the language it claims.
//
// The harvest picks names up from mixed-language pages, so a few land in the wrong
// slot — an English label sitting in title_ar (gov.krd's English microsites), a
// Kurmanji-Latin string in title_ku (Irshad's `ku` is Sorani), an Arabic string in
// title_en. Left alone these surface to a reader as the wrong script for their
// locale, which is worse than the field being empty and falling back.
import fs from 'node:fs';
import path from 'node:path';
import { search, pool } from './gmaps.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const IN = process.argv[2] || path.join(HERE, 'iraq-government-directory.json');
const ds = JSON.parse(fs.readFileSync(IN, 'utf8'));

const hasArabicScript = (s) => /[؀-ۿ]/.test(s || '');
// Sorani-only letters. Plain Arabic script alone is not enough — an Arabic name
// copied into title_ku would pass that, and Sorani is what the `ku` locale renders.
const hasSorani = (s) => /[ڕڵۆێگچپژڤکھەیۊڎ]/.test(s || '');
const hasLatin = (s) => /[A-Za-z]/.test(s || '');

const rows = [...ds.ministries, ...ds.directorates, ...ds.branches];
const stats = { movedArToEn: 0, droppedKu: 0, droppedEn: 0, recoveredAr: 0, stillLatinAr: 0 };

const needArabic = [];
for (const r of rows) {
  if (r.title_ku && !hasSorani(r.title_ku)) { r.title_ku = null; stats.droppedKu += 1; }
  if (r.title_en && !hasLatin(r.title_en)) { r.title_en = null; stats.droppedEn += 1; }
  if (r.title_ar && !hasArabicScript(r.title_ar)) {
    // This came off the ministry's own English page, not off a matched place.
    if (!r.title_en) { r.title_en = r.title_ar; r._title_en_source = 'ministry-site'; stats.movedArToEn += 1; }
    needArabic.push(r);
  }
}
console.log(`title_ku dropped (not Sorani): ${stats.droppedKu}`);
console.log(`title_en dropped (not Latin) : ${stats.droppedEn}`);
console.log(`title_ar holding a Latin name: ${needArabic.length} — trying to recover the Arabic`);

// Ask Maps for the same place in Arabic, matched by feature id so it is provably
// the same record and not a similarly-named neighbour.
let done = 0;
await pool(needArabic, 6, async (r) => {
  done += 1;
  if (done % 10 === 0) console.log(`  ... ${done}/${needArabic.length}`);
  if (!r.place_id) return;
  const q = `${r.title_en || r.title_ar} Iraq`;
  let hits = [];
  try { hits = await search(q, { lang: 'ar' }); } catch (e) { return; }
  const same = hits.find((p) => p.ftid && p.ftid === r.place_id);
  if (!same?.name || !hasArabicScript(same.name)) return;
  r.title_ar = same.name.replace(/\s+/g, ' ').trim();
  r._title_ar_recovered = 'google-maps hl=ar, matched by place id';
  stats.recoveredAr += 1;
});

for (const r of needArabic) {
  if (hasArabicScript(r.title_ar)) continue;
  // No Arabic name exists in any source. title_ar is required by the schema, so the
  // Latin name stays — flagged, so the admin can see which rows need a translation.
  r._title_ar_needs_translation = true;
  stats.stillLatinAr += 1;
}

fs.writeFileSync(IN, JSON.stringify(ds, null, 2));

console.log(`\nrecovered an Arabic name : ${stats.recoveredAr}`);
console.log(`still Latin in title_ar  : ${stats.stillLatinAr} (flagged _title_ar_needs_translation)`);
console.log('\ntotals now:');
for (const [name, list] of [['ministries', ds.ministries], ['directorates', ds.directorates], ['branches', ds.branches]]) {
  console.log(`  ${name.padEnd(13)} ar ${String(list.filter((r) => hasArabicScript(r.title_ar)).length).padStart(3)}`
    + `  en ${String(list.filter((r) => r.title_en).length).padStart(3)}`
    + `  ku ${String(list.filter((r) => r.title_ku).length).padStart(3)}`
    + `  of ${list.length}`);
}

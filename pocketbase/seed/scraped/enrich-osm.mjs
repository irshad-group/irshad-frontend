// Second enrichment pass over the built dataset, using OpenStreetMap.
//
// Fills three things Google Maps could not:
//   working_hours  — Maps' search response only carries today's interval
//   title_en / title_ku — from OSM's name:en / name:ckb / name:ku
//   phone / website / email — where OSM has one and Maps did not
//
// Matching is by coordinate proximity, tightened by name agreement: a government
// compound often holds several offices, so "nearest" alone would mislabel them.
//
// Data © OpenStreetMap contributors, ODbL.
import fs from 'node:fs';
import path from 'node:path';
import { load, parseOpeningHours, findNear } from './osm.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const IN = process.argv[2] || path.join(HERE, 'iraq-government-directory.json');
const ds = JSON.parse(fs.readFileSync(IN, 'utf8'));
const osm = load();

const KU = (t) => t['name:ckb'] || t['name:ku'] || t['name:kmr'] || null;
const EN = (t) => t['name:en'] || null;
const clean = (s) => (s ? String(s).replace(/\s+/g, ' ').trim() : null);

const stats = { matched: 0, hours: 0, en: 0, ku: 0, phone: 0, website: 0, email: 0 };

function enrich(rec, label) {
  const hit = findNear(osm, rec.gps_lat, rec.gps_lon, rec.title_ar || rec.title_en);
  if (!hit) return;
  const t = hit.osm.tags;
  stats.matched += 1;
  rec._osm = { id: hit.osm.id, distance_m: Math.round(hit.d), name_similarity: +hit.sim.toFixed(2) };

  if (!rec.working_hours && t.opening_hours) {
    const wh = parseOpeningHours(t.opening_hours);
    if (wh) { rec.working_hours = wh; rec._osm.opening_hours_raw = t.opening_hours; stats.hours += 1; }
  }
  if (!rec.title_en && EN(t)) { rec.title_en = clean(EN(t)); rec._title_en_source = 'place-match'; stats.en += 1; }
  if (!rec.title_ku && KU(t)) { rec.title_ku = clean(KU(t)); rec._title_ku_source = 'place-match'; stats.ku += 1; }
  if (!rec.phone && (t.phone || t['contact:phone'])) { rec.phone = clean(t.phone || t['contact:phone']); stats.phone += 1; }
  if (!rec.website && (t.website || t['contact:website'])) {
    const w = clean(t.website || t['contact:website']);
    if (/^https?:\/\//i.test(w)) { rec.website = w; stats.website += 1; }
  }
  if (!rec.email && (t.email || t['contact:email'])) { rec.email = clean(t.email || t['contact:email']); stats.email += 1; }
}

for (const m of ds.ministries) enrich(m, 'ministry');
for (const d of ds.directorates) enrich(d, 'directorate');
for (const b of ds.branches) enrich(b, 'branch');

ds.sources.osm = 'OpenStreetMap via Overpass (opening_hours, name:en / name:ckb, phone, website, email) — © OpenStreetMap contributors, ODbL';
ds.counts = {
  ministries: ds.ministries.length,
  directorates: ds.directorates.length,
  branches: ds.branches.length,
  gis_locations: ds.gis_locations.length,
};

fs.writeFileSync(IN, JSON.stringify(ds, null, 2));

const all = [...ds.ministries, ...ds.directorates, ...ds.branches];
console.log('OSM pass:');
console.log(`  matched to an OSM feature : ${stats.matched} / ${all.length}`);
console.log(`  working_hours filled      : ${stats.hours}`);
console.log(`  title_en filled           : ${stats.en}`);
console.log(`  title_ku filled           : ${stats.ku}`);
console.log(`  phone filled              : ${stats.phone}`);
console.log(`  website filled            : ${stats.website}`);
console.log(`  email filled              : ${stats.email}`);
console.log('\ntotals now:');
for (const [name, rows] of [['ministries', ds.ministries], ['directorates', ds.directorates], ['branches', ds.branches]]) {
  console.log(`  ${name.padEnd(13)} hours ${String(rows.filter((r) => r.working_hours).length).padStart(3)}`
    + `  en ${String(rows.filter((r) => r.title_en).length).padStart(3)}`
    + `  ku ${String(rows.filter((r) => r.title_ku).length).padStart(3)}`
    + `  phone ${String(rows.filter((r) => r.phone).length).padStart(3)}`
    + `  of ${rows.length}`);
}

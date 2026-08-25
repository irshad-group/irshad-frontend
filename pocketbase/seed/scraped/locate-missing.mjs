// Third pass: try to place the records that still have a name but no coordinates.
//
// Two attempts, cheapest first:
//   1. Name match against the OSM government layer already downloaded (no network).
//   2. Extra Google Maps queries with different phrasings — the first pass used one
//      wording, and Iraqi bodies are commonly written several ways
//      ("دائرة X" / "مديرية X العامة" / "X" alone / the English name).
//
// Anything still unplaced stays unplaced. A guessed pin sends someone to the wrong
// building, which is worse than the app saying it does not know.
import fs from 'node:fs';
import path from 'node:path';
import { load, nameOverlap, parseOpeningHours } from './osm.mjs';
import { search, pool } from './gmaps.mjs';
import { scorePlace, tokens, norm } from './match.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const IN = process.argv[2] || path.join(HERE, 'iraq-government-directory.json');
const ds = JSON.parse(fs.readFileSync(IN, 'utf8'));
const osm = load();
const mins = Object.fromEntries(ds.ministries.map((m) => [m.slug, m]));

const KRG_LAT = 34.8;
const clean = (s) => (s ? String(s).replace(/\s+/g, ' ').trim() : null);
const cleanAddr = (s) => clean(s)?.replace(/^[0-9A-Z]{4,7}\+[0-9A-Z]{2,4}\s*/, '') || null;

// --- 1. OSM by name ---------------------------------------------------------
const named = osm.filter((o) => o.tags.name || o.tags['name:ar'] || o.tags['name:en']);
function osmByName(titles, krg) {
  // Compare against every language we hold, not just Arabic: many KRG bodies are
  // tagged in OSM only in Kurdish or English, so an Arabic-only compare misses them.
  const want = titles.filter(Boolean);
  if (!want.length) return null;
  let best = null;
  for (const o of named) {
    if (krg && o.lat < KRG_LAT) continue;
    if (!krg && o.lat >= 36.5) continue;      // federal HQs are not in Duhok
    for (const key of ['name', 'name:ar', 'name:en', 'name:ckb', 'name:ku']) {
      const n = o.tags[key];
      if (!n) continue;
      for (const title of want) {
        const sim = Math.min(nameOverlap(title, n), nameOverlap(n, title) * 1.2);
        if (sim < 0.75) continue;
        if (!best || sim > best.sim) best = { o, sim, matched: n };
      }
    }
  }
  return best;
}

// --- 2. extra Maps phrasings ------------------------------------------------
const WEAK = new Set(['العامة', 'العام', 'الوزارة', 'الفنية', 'الادارية', 'المالية', 'القانونية']);
const mustFor = (name) => {
  const t = tokens(name).filter((w) => !WEAK.has(w));
  return t.length ? t.slice(0, 2) : tokens(name).slice(0, 1);
};

function variants(rec) {
  const t = rec.title_ar;
  const bare = t.replace(/^(دائرة|الدائرة|مديرية|المديرية|هيئة|الهيئة|الشركة العامة|وكالة|الوكالة)\s+/, '').trim();
  const min = mins[rec.ministry_slug];
  const where = rec.krg ? 'اربيل' : 'بغداد';
  const out = [bare + ' ' + where, t, `${bare} ${min ? min.title_ar.split('—')[0].trim() : ''}`.trim()];
  if (rec.title_en) out.push(`${rec.title_en} Iraq`);
  return [...new Set(out.filter((q) => q && q.length > 5))];
}

const unlocated = [
  ...ds.ministries.filter((m) => !m.gps_lat).map((r) => ({ r, kind: 'ministry' })),
  ...ds.directorates.filter((d) => !d.gps_lat).map((r) => ({ r, kind: 'directorate' })),
];
console.log(`unplaced to chase: ${unlocated.length}`);

let viaOsm = 0;
for (const { r } of unlocated) {
  const krg = r.krg ?? !!mins[r.ministry_slug]?.krg;
  const hit = osmByName([r.title_ar, r.title_ku, r.title_en], krg);
  if (!hit) continue;
  r.gps_lat = hit.o.lat;
  r.gps_lon = hit.o.lon;
  r._located_by = { source: 'openstreetmap', matched_name: hit.matched, similarity: +hit.sim.toFixed(2), id: hit.o.id };
  const t = hit.o.tags;
  if (!r.phone && (t.phone || t['contact:phone'])) r.phone = clean(t.phone || t['contact:phone']);
  if (!r.website && t.website && /^https?:/i.test(t.website)) r.website = clean(t.website);
  if (!r.email && t.email) r.email = clean(t.email);
  if (!r.title_en && t['name:en']) { r.title_en = clean(t['name:en']); r._title_en_source = 'place-match'; }
  if (!r.title_ku && (t['name:ckb'] || t['name:ku'])) { r.title_ku = clean(t['name:ckb'] || t['name:ku']); r._title_ku_source = 'place-match'; }
  if (!r.working_hours && t.opening_hours) {
    const wh = parseOpeningHours(t.opening_hours);
    if (wh) r.working_hours = wh;
  }
  viaOsm += 1;
}
console.log(`placed via OSM name match: ${viaOsm}`);

// --- Maps, for whatever OSM could not place ---------------------------------
const still = unlocated.filter(({ r }) => !r.gps_lat);
console.log(`still unplaced, retrying Maps with other phrasings: ${still.length}`);

let done = 0;
let viaMaps = 0;
await pool(still, 6, async ({ r }) => {
  const krg = r.krg ?? !!mins[r.ministry_slug]?.krg;
  const map = new Map();
  for (const q of variants(r)) {
    for (const p of await search(q, { lang: 'ar' })) {
      const k = p.ftid || `${p.name}@${p.lat}`;
      if (!map.has(k)) map.set(k, p);
    }
  }
  const ranked = [...map.values()]
    .map((p) => ({ p, s: scorePlace(p, { must: mustFor(r.title_ar), krg }) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);

  done += 1;
  if (done % 20 === 0) console.log(`  ... ${done}/${still.length}`);
  const top = ranked[0]?.p;
  if (!top) return;
  // Same confidence bar as the first pass: a weak name overlap is not this record.
  const want = new Set(tokens(r.title_ar));
  const got = norm(top.name);
  let hit = 0;
  for (const w of want) if (got.includes(w)) hit += 1;
  const conf = want.size ? hit / want.size : 0;
  if (conf < 0.5) return;

  r.gps_lat = top.lat;
  r.gps_lon = top.lon;
  r.phone = r.phone || top.phone || null;
  r.address_ar = r.address_ar || cleanAddr(top.address);
  r.photo_url = r.photo_url || top.photo || null;
  r.place_id = r.place_id || top.ftid || null;
  r.maps_url = r.maps_url || top.maps_url || null;
  if (!r.website && top.website) r.website = top.website;
  r._located_by = { source: 'google-maps (retry)', matched_name: top.name, confidence: +conf.toFixed(2) };
  viaMaps += 1;
});
console.log(`placed via Maps retry: ${viaMaps}`);

fs.writeFileSync(IN, JSON.stringify(ds, null, 2));

const allM = ds.ministries;
const allD = ds.directorates;
console.log('\nafter the chase:');
console.log(`  ministries   located ${allM.filter((m) => m.gps_lat).length}/${allM.length}`);
console.log(`  directorates located ${allD.filter((d) => d.gps_lat).length}/${allD.length}`);
const leftM = allM.filter((m) => !m.gps_lat).map((m) => m.slug);
if (leftM.length) console.log(`  ministries still unplaced: ${leftM.join(', ')}`);

#!/usr/bin/env node
/**
 * Fold what the ministries' own websites gave us into the dataset.
 *
 * Runs last, like the OSM and locate passes, and for the same reason: it adds
 * to a built dataset rather than being another input to the build, so a change
 * here cannot disturb the twenty-odd ministries it has nothing to do with.
 *
 * Only adds records. An existing one is left exactly as it is, so this is safe
 * to re-run and cannot quietly overwrite a better-sourced address with a worse
 * one. The one exception is the contact table below, which deliberately
 * replaces, and says why.
 *
 *   node merge-ministry-sites.mjs [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';
import { norm } from './match.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const DRY = process.argv.includes('--dry');
const file = (f) => path.join(HERE, f);
const read = (f) => JSON.parse(fs.readFileSync(file(f), 'utf8'));

const dataset = read('iraq-government-directory.json');
const newBranches = read('ministry-site-branches.json');
const newDirectorates = read('ministry-site-directorates.json');

const before = {
  directorates: dataset.directorates.length,
  branches: dataset.branches.length,
};

/**
 * Contact details a ministry publishes on its own contact page.
 *
 * Read off `mod.mil.iq/?page=2461` by hand rather than scraped, because the page
 * lists five channels for five different offices and only the sentence above
 * each one says which is which. A regex would have picked the first number it
 * found; these are the two the page actually offers a citizen.
 *
 * This overwrites, unlike everything else here. Defence's stored number was a
 * `+964 780` mobile that Google Maps attached to the building — plausible enough
 * to survive review, and not something the ministry ever published. A number
 * printed on the ministry's own contact page beats one inferred from a map pin,
 * and a wrong phone number on a government directory is worse than none.
 */
const CONTACTS = [
  {
    kind: 'ministry',
    slug: 'ministry-of-defence',
    // "الاتصال عبر الخط الساخن لقسم الإعلام والعلاقات - مكتب الأمين العام"
    phone: '+964 790 111 5965',
    email: 'sgoffice@mod.mil.iq',
  },
  {
    kind: 'directorate',
    // Scoped to the ministry, not just the title: Interior, Justice and Defence
    // each have a "مديرية حقوق الإنسان", and matching on the name alone put
    // Defence's hotline on Interior's directorate.
    ministry_slug: 'ministry-of-defence',
    title_ar: 'مديرية حقوق الانسان',
    // "الخط الساخن لمديرية حقوق الإنسان"
    phone: '+964 790 194 5476',
    email: 'hmr-dir@mod.mil.iq',
  },
];

let contactsApplied = 0;
for (const c of CONTACTS) {
  const rows = c.kind === 'ministry'
    ? dataset.ministries.filter((m) => m.slug === c.slug)
    : dataset.directorates.filter((d) => d.ministry_slug === c.ministry_slug
      && norm(d.title_ar) === norm(c.title_ar));
  if (!rows.length) { console.log(`  contact target not found: ${c.slug ?? c.title_ar}`); continue; }
  for (const row of rows) {
    const changed = row.phone !== c.phone || row.email !== c.email;
    if (!changed) continue;
    console.log(`  ${row.title_ar}: phone ${row.phone || '—'} -> ${c.phone}, email ${row.email || '—'} -> ${c.email}`);
    row.phone = c.phone;
    row.email = c.email;
    row._contact_source = 'https://mod.mil.iq/?page=2461';
    contactsApplied += 1;
  }
}

// --- directorates -----------------------------------------------------------
const haveDirectorate = new Set(dataset.directorates.map((d) => `${d.ministry_slug}::${norm(d.title_ar)}`));
const haveSlug = new Set(dataset.directorates.map((d) => d.slug));
let addedDirectorates = 0;
for (const d of newDirectorates) {
  const key = `${d.ministry_slug}::${norm(d.title_ar)}`;
  if (haveDirectorate.has(key)) continue;
  // Slugs are the public URL and have to stay unique across the whole dataset.
  let slug = d.slug;
  for (let n = 2; haveSlug.has(slug); n += 1) slug = `${d.slug}-${n}`;
  haveSlug.add(slug);
  haveDirectorate.add(key);
  dataset.directorates.push({ ...d, slug, sort_order: 0 });
  addedDirectorates += 1;
}

// --- branches ---------------------------------------------------------------
const directorateSlugs = new Set(dataset.directorates.map((d) => d.slug));
const haveBranch = new Set(dataset.branches.map((b) => `${b.directorate_slug}::${norm(b.title_ar)}`));
let addedBranches = 0;
const orphans = [];
for (const b of newBranches) {
  if (!directorateSlugs.has(b.directorate_slug)) { orphans.push(b); continue; }
  const key = `${b.directorate_slug}::${norm(b.title_ar)}`;
  if (haveBranch.has(key)) continue;
  haveBranch.add(key);
  dataset.branches.push({
    directorate_slug: b.directorate_slug,
    province_code: b.province_code,
    title_ar: b.title_ar,
    title_en: null,
    title_ku: null,
    address_ar: b.address_ar ?? null,
    gps_lat: b.gps_lat,
    gps_lon: b.gps_lon,
    phone: b.phone ?? null,
    website: b.website ?? null,
    email: null,
    working_hours: null,
    photo_url: b.photo_url ?? null,
    place_id: b.place_id ?? null,
    maps_url: b.maps_url ?? null,
    sort_order: 0,
    archived: false,
    _source: b._source,
    _source_url: b._source_url,
    _placed: b._placed,
  });
  addedBranches += 1;
}

if (orphans.length) {
  console.log(`${orphans.length} office(s) had no directorate to hang on and were skipped:`);
  for (const o of orphans.slice(0, 5)) console.log(`  ${o.directorate_slug} — ${o.title_ar}`);
}

dataset.counts = {
  ...dataset.counts,
  ministries: dataset.ministries.length,
  directorates: dataset.directorates.length,
  branches: dataset.branches.length,
};
// `sources` documents where each collection's data came from, per collection.
const NOTE = 'the ministries\' own websites for Defence and Industry, which neither Maps nor OSM covers';
for (const key of ['directorates', 'branches']) {
  if (typeof dataset.sources[key] === 'string' && !dataset.sources[key].includes(NOTE)) {
    dataset.sources[key] = `${dataset.sources[key]}, ${NOTE}`;
  }
}

console.log(`directorates ${before.directorates} -> ${dataset.directorates.length} (+${addedDirectorates})`);
console.log(`branches     ${before.branches} -> ${dataset.branches.length} (+${addedBranches})`);
console.log(`contacts     ${contactsApplied} record(s) took the ministry's published phone and email`);

if (DRY) { console.log('\n--dry: nothing written.'); process.exit(0); }
fs.writeFileSync(file('iraq-government-directory.json'), JSON.stringify(dataset, null, 2));
console.log('\niraq-government-directory.json updated.');

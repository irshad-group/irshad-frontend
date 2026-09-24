#!/usr/bin/env node
/**
 * Adds the fields the ministry/directorate/branch scrape needs and the current
 * schema does not have. Idempotent: a field that already exists is left alone.
 *
 *   ministries           + photos (file[10])   + working_hours (json) + place_id (text)
 *   directorates         + place_id (text)
 *   directorate_branches + website (url) + email (email) + working_hours (json) + place_id (text)
 *
 * Why each one:
 *   photos          — a building photo is the wayfinding cue for a citizen who has
 *                     never been there. `directorates` and `directorate_branches`
 *                     already carry it; `ministries` was the odd one out.
 *   working_hours   — `directorates` already has it. Branches are the level a
 *                     citizen actually travels to, so they need it more, not less.
 *                     Same shape: [{day:'SUN',from:'08:00',to:'14:00',note?}].
 *   website / email — branches routinely run their own portal and inbox.
 *   place_id        — Google Maps feature id ("0x…:0x…"). Coordinates drift when a
 *                     record is re-scraped; the place id is stable, so it is what
 *                     lets a later run tell "same office, better coordinates" from
 *                     "different office".
 *
 * Usage:
 *   PB_URL=... PB_EMAIL=... PB_PASSWORD=... node pocketbase/migrations/001-geography-contact-fields.mjs [--dry-run]
 */

const DRY = process.argv.includes('--dry-run');
const { PB_URL, PB_EMAIL, PB_PASSWORD } = process.env;
if (!PB_URL || !PB_EMAIL || !PB_PASSWORD) {
  console.error('PB_URL, PB_EMAIL and PB_PASSWORD must all be set.');
  process.exit(1);
}
const BASE = PB_URL.replace(/\/$/, '');

const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'];

const ADDITIONS = {
  ministries: [
    { name: 'photos', type: 'file', maxSelect: 10, maxSize: 5242880, mimeTypes: IMAGE_MIME, protected: false },
    { name: 'working_hours', type: 'json', maxSize: 8192 },
    { name: 'place_id', type: 'text', max: 64 },
  ],
  directorates: [
    { name: 'place_id', type: 'text', max: 64 },
  ],
  directorate_branches: [
    { name: 'website', type: 'url', exceptDomains: [], onlyDomains: [] },
    { name: 'email', type: 'email', exceptDomains: [], onlyDomains: [] },
    { name: 'working_hours', type: 'json', maxSize: 8192 },
    { name: 'place_id', type: 'text', max: 64 },
  ],
};

async function api(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`${init.method || 'GET'} ${path} -> ${res.status} ${body}`);
  return body ? JSON.parse(body) : null;
}

const auth = await api('/api/collections/_superusers/auth-with-password', {
  method: 'POST',
  body: JSON.stringify({ identity: PB_EMAIL, password: PB_PASSWORD }),
});
const H = { Authorization: auth.token };

let added = 0;
let skipped = 0;
for (const [name, fields] of Object.entries(ADDITIONS)) {
  const col = await api(`/api/collections/${name}`, { headers: H });
  const have = new Set(col.fields.map((f) => f.name));
  const toAdd = fields.filter((f) => !have.has(f.name));
  skipped += fields.length - toAdd.length;
  for (const f of fields) {
    if (have.has(f.name)) console.log(`  = ${name}.${f.name} (already present)`);
  }
  if (!toAdd.length) continue;
  for (const f of toAdd) console.log(`  + ${name}.${f.name} (${f.type})`);
  added += toAdd.length;
  if (DRY) continue;
  await api(`/api/collections/${col.id}`, {
    method: 'PATCH',
    headers: H,
    body: JSON.stringify({ fields: [...col.fields, ...toAdd] }),
  });
  console.log(`  -> ${name} updated`);
}

console.log(`\n${DRY ? '[dry run] would add' : 'added'} ${added} field(s); ${skipped} already present.`);
if (added && !DRY) console.log('Regenerate types next:  node scripts/generate-types.mjs');

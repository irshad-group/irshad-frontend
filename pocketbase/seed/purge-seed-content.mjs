#!/usr/bin/env node
/**
 * Delete the development seed's partners, comments and reviews from the live
 * instance.
 *
 * All three collections held nothing but seed rows, and all three said things
 * about the world that are not true:
 *
 *   partners  — six real organisations, including a UN agency and two
 *               ministries, listed under "المؤسسات التي يعمل معها إرشاد" on a
 *               site whose own header says it is affiliated with no government
 *               body. Every one of them a claim about a third party who never
 *               agreed to it.
 *   comments  — specific operational claims about real offices ("The Karkh
 *               office now opens a second counter at 07:30"), invented to give
 *               the moderation queue something to show.
 *   reviews   — ratings and testimonials from users who do not exist.
 *
 * None of it was ever rendered on the public site except the partners, but
 * `approved = true` made the comments and reviews readable through the public
 * API, which is publication enough.
 *
 * Only removes rows carrying the seed's own id prefix, so it is safe to re-run
 * and cannot delete a real comment written later. Anything it does not
 * recognise is reported rather than removed.
 *
 * Usage:
 *   PB_URL=... PB_EMAIL=... PB_PASSWORD=... node pocketbase/seed/purge-seed-content.mjs [--dry-run]
 */

const DRY = process.argv.includes('--dry-run');
const { PB_URL, PB_EMAIL, PB_PASSWORD } = process.env;
if (!PB_URL || !PB_EMAIL || !PB_PASSWORD) {
  console.error('PB_URL, PB_EMAIL and PB_PASSWORD must all be set.');
  process.exit(1);
}
const BASE = PB_URL.replace(/\/$/, '');

/** Collection -> the id prefix `seed.mjs` gives its rows, and how to describe one. */
const TARGETS = [
  { collection: 'partners', prefix: 'ptr', label: (r) => r.name_ar || r.name_en || r.id },
  { collection: 'comments', prefix: 'cmt', label: (r) => r.body },
  { collection: 'reviews', prefix: 'rvw', label: (r) => `${r.rating ?? '?'}★ ${r.body ?? ''}` },
];

async function api(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${init.method || 'GET'} ${path} -> ${res.status} ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

const auth = await api('/api/collections/_superusers/auth-with-password', {
  method: 'POST',
  body: JSON.stringify({ identity: PB_EMAIL, password: PB_PASSWORD }),
});
const H = { Authorization: auth.token };

let deleted = 0;
let kept = 0;

for (const { collection, prefix, label } of TARGETS) {
  const { items } = await api(`/api/collections/${collection}/records?perPage=500`, { headers: H });
  const seeded = items.filter((r) => r.id.startsWith(prefix));
  const others = items.filter((r) => !r.id.startsWith(prefix));

  console.log(`\n${collection}: ${items.length} record(s), ${seeded.length} from the seed`);
  for (const row of seeded) {
    console.log(`   ${DRY ? 'would delete' : 'deleted'}  ${String(label(row) ?? '').replace(/\s+/g, ' ').slice(0, 62)}`);
    if (!DRY) await api(`/api/collections/${collection}/records/${row.id}`, { method: 'DELETE', headers: H });
    deleted += 1;
  }
  for (const row of others) {
    console.log(`   KEPT (not a seed row, check by hand)  ${row.id}  ${String(label(row) ?? '').slice(0, 40)}`);
    kept += 1;
  }
}

console.log(`\n${DRY ? 'Would delete' : 'Deleted'} ${deleted} record(s); kept ${kept} that the seed did not create.`);
if (DRY) console.log('--dry-run: nothing was deleted.');

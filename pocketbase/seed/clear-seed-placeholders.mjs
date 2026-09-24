#!/usr/bin/env node
/**
 * Clear the development seed's invented phone numbers.
 *
 * The seed filled `phone` on a fixed grid — +964 780 000 1000, +964 780 100 1001,
 * +964 750 200 0401 — as plausible-looking filler. That was harmless while the
 * collections held nothing but seed data. It is not harmless now: those 34 rows sit
 * in the same collections as 232 scraped numbers, look exactly like them, and a
 * citizen reading the directory would dial one.
 *
 * An empty field falls back to "no number published". A fabricated one sends someone
 * to a wrong number, so the fabricated ones go.
 *
 * Only rows that (a) match the seed grid, (b) existed before the import — proven
 * against a pre-import dump, not guessed — and (c) have no scraped number to replace
 * them are touched. Nothing else is modified and nothing is deleted.
 *
 * Usage:
 *   PB_URL=... PB_EMAIL=... PB_PASSWORD=... \
 *     node pocketbase/seed/clear-seed-placeholders.mjs --before <pre-import.json> [--dry-run]
 */

import fs from 'node:fs';

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const DRY = argv.includes('--dry-run');
const BEFORE = arg('--before');

const { PB_URL, PB_EMAIL, PB_PASSWORD } = process.env;
if (!PB_URL || !PB_EMAIL || !PB_PASSWORD || !BEFORE) {
  console.error('Needs PB_URL, PB_EMAIL, PB_PASSWORD and --before <pre-import dump>.');
  process.exit(1);
}
const BASE = PB_URL.replace(/\/$/, '');

// The seed grid: +964 7[58]0 <000|100|200> NNNN. Real Iraqi numbers do not sit on it,
// but the id check below is what actually makes this safe.
const SEED_PHONE = /^\+964\s?7[58]0\s?[0-2]00\s?\d{4}$/;

const before = JSON.parse(fs.readFileSync(BEFORE, 'utf8'));
const seededIds = new Set();
for (const col of ['ministries', 'directorates', 'directorate_branches']) {
  for (const r of before[col] || []) seededIds.add(`${col}:${r.id}`);
}

async function api(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init, headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  const t = await res.text();
  if (!res.ok) throw new Error(`${init.method || 'GET'} ${path} -> ${res.status} ${t.slice(0, 300)}`);
  return t ? JSON.parse(t) : null;
}

const auth = await api('/api/collections/_superusers/auth-with-password', {
  method: 'POST', body: JSON.stringify({ identity: PB_EMAIL, password: PB_PASSWORD }),
});
const H = { Authorization: auth.token };

const listAll = async (c) => {
  const out = [];
  for (let p = 1; ; p++) {
    const j = await api(`/api/collections/${c}/records?perPage=500&page=${p}`, { headers: H });
    out.push(...j.items);
    if (p >= j.totalPages) break;
  }
  return out;
};

let cleared = 0;
for (const col of ['ministries', 'directorates', 'directorate_branches']) {
  const rows = await listAll(col);
  const targets = rows.filter((r) => SEED_PHONE.test(r.phone || '') && seededIds.has(`${col}:${r.id}`));
  for (const r of targets) {
    console.log(`  ${col.padEnd(22)} ${String(r.slug || r.title_ar).slice(0, 44).padEnd(46)} ${r.phone} -> (cleared)`);
    if (!DRY) await api(`/api/collections/${col}/records/${r.id}`, { method: 'PATCH', headers: H, body: JSON.stringify({ phone: '' }) });
    cleared += 1;
  }
  const skipped = rows.filter((r) => SEED_PHONE.test(r.phone || '') && !seededIds.has(`${col}:${r.id}`));
  if (skipped.length) console.log(`  ${col}: ${skipped.length} row(s) match the grid but post-date the import — left alone`);
}

console.log(`\n${DRY ? '[dry run] would clear' : 'cleared'} ${cleared} invented phone number(s).`);

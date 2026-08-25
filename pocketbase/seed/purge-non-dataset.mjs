#!/usr/bin/env node
/**
 * Delete every ministry, directorate and branch the scraped dataset does not contain.
 *
 * The development seed invented its content — plausible names, fabricated phone
 * numbers, placeholder logos. That was fine while nothing else was in the database.
 * Once the real directory landed beside it, a reader could not tell the two apart,
 * so the invented rows have to go rather than sit there looking authoritative.
 *
 * Scope is the three collections the dataset covers. `procedures`, `procedure_items`,
 * `files`, `comments` and `reviews` are left alone: the scrape has no replacement for
 * them, and deleting content this dataset says nothing about is not a cleanup.
 *
 * Refuses to delete anything another record still points at. Nothing in this codebase
 * cascades, so an orphaned procedure would simply lose its office.
 *
 * Usage:
 *   PB_URL=... PB_EMAIL=... PB_PASSWORD=... \
 *     node pocketbase/seed/purge-non-dataset.mjs --data <dataset.json> [--dry-run]
 */

import fs from 'node:fs';

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const DRY = argv.includes('--dry-run');
const DATA = arg('--data');

const { PB_URL, PB_EMAIL, PB_PASSWORD } = process.env;
if (!PB_URL || !PB_EMAIL || !PB_PASSWORD || !DATA) {
  console.error('Needs PB_URL, PB_EMAIL, PB_PASSWORD and --data <dataset.json>.');
  process.exit(1);
}
const BASE = PB_URL.replace(/\/$/, '');

// Kept in step with the importer: it remaps these titles onto the seed's slugs so it
// can update those rows in place, so "in the dataset" has to be judged the same way.
const KEEP_SLUGS = {
  'المديرية العامة للجنسية': 'general-directorate-of-nationality',
  'مديرية شؤون الجوازات العامة': 'general-directorate-of-passports',
  'مديرية المرور العامة': 'general-directorate-of-traffic',
  'مديرية الإقامة العامة': 'general-directorate-of-residence',
  'مديرية الاقامة العامة': 'general-directorate-of-residence',
  'دائرة الصحة العامة': 'directorate-of-public-health',
  'المديرية العامة لتربية بغداد الرصافة': 'general-directorate-of-education-baghdad-rusafa',
  'دائرة الدراسات والتخطيط والمتابعة': 'directorate-of-studies-and-planning',
  'دائرة البعثات والعلاقات الثقافية': 'directorate-of-missions-and-cultural-relations',
  'الهيئة العامة للضرائب': 'general-commission-for-taxes',
  'الهيئة العامة للكمارك': 'general-commission-of-customs',
  'هيئة التقاعد الوطنية': 'national-board-of-pensions',
  'دائرة التسجيل العقاري': 'real-estate-registration-department',
  'دائرة الكاتب العدل': 'notary-public-department',
  'هيئة الحماية الاجتماعية': 'social-protection-authority',
  'دائرة تسجيل الشركات': 'companies-registration-department',
  'الشركة العامة لتجارة المواد الغذائية': 'general-company-for-foodstuff-trading',
};

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

const ds = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const wantMin = new Set(ds.ministries.map((m) => m.slug));
const wantDir = new Set(ds.directorates.map((d) => KEEP_SLUGS[d.title_ar] || d.slug));
const wantBranch = new Set(ds.branches.filter((b) => b.place_id).map((b) => b.place_id));

const [mins, dirs, brs, procs, items, files, comments, reviews, subs] = await Promise.all(
  ['ministries', 'directorates', 'directorate_branches', 'procedures', 'procedure_items',
    'files', 'comments', 'reviews', 'procedure_submissions'].map(listAll));

const staleMin = mins.filter((m) => !wantMin.has(m.slug));
const staleDir = dirs.filter((d) => !wantDir.has(d.slug));
const staleBr = brs.filter((b) => !b.place_id || !wantBranch.has(b.place_id));

// Refuse to orphan anything.
const blocked = [];
const dirIds = new Set(staleDir.map((d) => d.id));
const minIds = new Set(staleMin.map((m) => m.id));
for (const p of procs) if (dirIds.has(p.directorate)) blocked.push(`procedure ${p.slug} -> directorate`);
for (const f of files) if (dirIds.has(f.directorate) || minIds.has(f.ministry)) blocked.push(`file ${f.id}`);
for (const c of comments) if (dirIds.has(c.directorate) || minIds.has(c.ministry)) blocked.push(`comment ${c.id}`);
for (const r of reviews) if (dirIds.has(r.directorate) || minIds.has(r.ministry)) blocked.push(`review ${r.id}`);
for (const s of subs) if (dirIds.has(s.directorate) || minIds.has(s.ministry)) blocked.push(`submission ${s.id}`);
const brIds = new Set(staleBr.map((b) => b.id));
for (const d of dirs) if (brIds.has(d.id)) blocked.push(`directorate ${d.slug}`);

console.log(`ministries  : ${staleMin.length} not in the dataset (of ${mins.length})`);
console.log(`directorates: ${staleDir.length} not in the dataset (of ${dirs.length})`);
console.log(`branches    : ${staleBr.length} not in the dataset (of ${brs.length})`);
console.log('untouched   : procedures, procedure_items, files, comments, reviews, provinces');

if (blocked.length) {
  console.error(`\nREFUSING: ${blocked.length} record(s) still point at rows this would delete:`);
  for (const b of blocked.slice(0, 20)) console.error(`  ${b}`);
  process.exit(1);
}

let deleted = 0;
for (const [col, rows] of [['directorate_branches', staleBr], ['directorates', staleDir], ['ministries', staleMin]]) {
  for (const r of rows) {
    console.log(`  ${DRY ? 'would delete' : 'delete'} ${col.padEnd(22)} ${String(r.slug || r.title_ar).slice(0, 48)}`);
    if (!DRY) await api(`/api/collections/${col}/records/${r.id}`, { method: 'DELETE', headers: H });
    deleted += 1;
  }
}
console.log(`\n${DRY ? '[dry run] would delete' : 'deleted'} ${deleted} record(s).`);

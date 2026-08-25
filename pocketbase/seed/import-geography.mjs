#!/usr/bin/env node
/**
 * Import the scraped ministry / directorate / branch dataset into PocketBase.
 *
 * Upserts by slug, so it is safe to re-run: an existing record is PATCHed, never
 * duplicated, and never deleted. That matters because the development seed's
 * directorates already have `procedures` hanging off them — replacing those rows
 * would orphan every procedure that points at one. The KEEP_SLUGS map below
 * re-uses those existing records instead of creating near-duplicates beside them.
 *
 * Files (logos and building photos) are fetched and uploaded only with --files,
 * because that turns a fast metadata pass into a slow one.
 *
 * Usage:
 *   PB_URL=... PB_EMAIL=... PB_PASSWORD=... \
 *     node pocketbase/seed/import-geography.mjs --data ./dataset.json [--dry-run] [--files]
 */

import fs from 'node:fs';

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const DRY = argv.includes('--dry-run');
const WITH_FILES = argv.includes('--files');
const DATA = arg('--data', './dataset.json');

const { PB_URL, PB_EMAIL, PB_PASSWORD } = process.env;
if (!PB_URL || !PB_EMAIL || !PB_PASSWORD) {
  console.error('PB_URL, PB_EMAIL and PB_PASSWORD must all be set.');
  process.exit(1);
}
const BASE = PB_URL.replace(/\/$/, '');
const ds = JSON.parse(fs.readFileSync(DATA, 'utf8'));

/**
 * Directorates already present in the development seed, keyed by the Arabic title
 * the scrape produces. Matching here keeps their id — and therefore every
 * procedure, procedure_item and file already attached to them.
 */
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
    ...init,
    headers: {
      ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${init.method || 'GET'} ${path} -> ${res.status} ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : null;
}

const auth = await api('/api/collections/_superusers/auth-with-password', {
  method: 'POST',
  body: JSON.stringify({ identity: PB_EMAIL, password: PB_PASSWORD }),
});
const H = { Authorization: auth.token };

async function listAll(col) {
  const out = [];
  for (let page = 1; ; page++) {
    const r = await api(`/api/collections/${col}/records?perPage=500&page=${page}`, { headers: H });
    out.push(...r.items);
    if (page >= r.totalPages) break;
  }
  return out;
}

/** Which optional fields the live schema actually has, so we never PATCH an unknown one. */
async function fieldsOf(col) {
  const c = await api(`/api/collections/${col}`, { headers: H });
  return new Set(c.fields.map((f) => f.name));
}

const drop = (obj, allowed) => Object.fromEntries(
  Object.entries(obj).filter(([k, v]) => allowed.has(k) && v !== null && v !== undefined),
);

const stats = { created: 0, updated: 0, skipped: 0, files: 0 };

async function upsert(col, key, keyVal, body, existingIndex, allowed) {
  const payload = drop(body, allowed);
  const found = existingIndex.get(keyVal);
  if (found) {
    if (DRY) { stats.updated++; return found.id; }
    await api(`/api/collections/${col}/records/${found.id}`, {
      method: 'PATCH', headers: H, body: JSON.stringify(payload),
    });
    stats.updated++;
    return found.id;
  }
  if (DRY) { stats.created++; return `dry-${keyVal}`; }
  const rec = await api(`/api/collections/${col}/records`, {
    method: 'POST', headers: H, body: JSON.stringify({ ...payload, [key]: keyVal }),
  });
  existingIndex.set(keyVal, rec);
  stats.created++;
  return rec.id;
}

async function attach(col, id, field, url) {
  if (!WITH_FILES || !url || DRY) return;
  try {
    const res = await fetch(url);
    if (!res.ok) return;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 500) return;                       // placeholder / error image
    const type = res.headers.get('content-type') || 'image/jpeg';
    const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : type.includes('svg') ? 'svg' : 'jpg';
    const fd = new FormData();
    fd.append(field, new Blob([buf], { type }), `${field}.${ext}`);
    await api(`/api/collections/${col}/records/${id}`, { method: 'PATCH', headers: H, body: fd });
    stats.files++;
  } catch (e) { /* a missing image must not fail the import */ }
}

// ---------------------------------------------------------------- provinces
const provinces = await listAll('provinces');
const provByCode = new Map(provinces.map((p) => [p.code, p]));
console.log(`provinces: ${provinces.length} present (not modified)`);

// --------------------------------------------------------------- ministries
const minFields = await fieldsOf('ministries');
const minIndex = new Map((await listAll('ministries')).map((m) => [m.slug, m]));
const minIdBySlug = new Map();

for (const m of ds.ministries) {
  const id = await upsert('ministries', 'slug', m.slug, {
    title_ar: m.title_ar, title_en: m.title_en, title_ku: m.title_ku,
    krg: m.krg, website: m.website, phone: m.phone, email: m.email,
    address_ar: m.address_ar, address_en: m.address_en, address_ku: m.address_ku,
    gps_lat: m.gps_lat, gps_lon: m.gps_lon,
    place_id: m.place_id, working_hours: m.working_hours,
    sort_order: m.sort_order, archived: false,
  }, minIndex, minFields);
  minIdBySlug.set(m.slug, id);
  await attach('ministries', id, 'logo', m.logo_url);
  if (minFields.has('photos')) await attach('ministries', id, 'photos', m.photo_url);
}
console.log(`ministries: ${ds.ministries.length} processed`);

// ------------------------------------------------------------- directorates
const dirFields = await fieldsOf('directorates');
const dirIndex = new Map((await listAll('directorates')).map((d) => [d.slug, d]));
const dirIdBySlug = new Map();

for (const d of ds.directorates) {
  const ministry = minIdBySlug.get(d.ministry_slug);
  if (!ministry || String(ministry).startsWith('dry-')) {
    if (!ministry) { stats.skipped++; console.warn(`  skip directorate (no ministry ${d.ministry_slug}): ${d.title_ar}`); continue; }
  }
  const slug = KEEP_SLUGS[d.title_ar] || d.slug;
  const id = await upsert('directorates', 'slug', slug, {
    ministry, title_ar: d.title_ar, title_en: d.title_en || d.title_ar, title_ku: d.title_ku,
    website: d.website, phone: d.phone, email: d.email, address_ar: d.address_ar,
    gps_lat: d.gps_lat, gps_lon: d.gps_lon,
    working_hours: d.working_hours, place_id: d.place_id,
    sort_order: d.sort_order, archived: false,
  }, dirIndex, dirFields);
  dirIdBySlug.set(d.slug, id);
  await attach('directorates', id, 'photos', d.photo_url);
}
console.log(`directorates: ${ds.directorates.length} processed`);

// ------------------------------------------------------------------ branches
const brFields = await fieldsOf('directorate_branches');
const existingBranches = await listAll('directorate_branches');
// Branches have no unique slug in the schema, so key on directorate + title.
const brIndex = new Map(existingBranches.map((b) => [`${b.directorate}::${b.title_ar}`, b]));

for (const b of ds.branches) {
  const directorate = dirIdBySlug.get(b.directorate_slug);
  const province = provByCode.get(b.province_code)?.id;
  if (!directorate || !province) { stats.skipped++; continue; }
  const key = `${directorate}::${b.title_ar}`;
  const id = await upsert('directorate_branches', 'title_ar', b.title_ar, {
    directorate, province,
    title_ar: b.title_ar, title_en: b.title_en || b.title_ar, title_ku: b.title_ku,
    address_ar: b.address_ar, gps_lat: b.gps_lat, gps_lon: b.gps_lon,
    phone: b.phone, website: b.website, email: b.email,
    working_hours: b.working_hours, place_id: b.place_id,
    sort_order: b.sort_order, archived: false,
  }, brIndex, brFields);
  // upsert() keyed on title_ar; re-key the index entry so a re-run finds it.
  if (!DRY) brIndex.set(key, { id });
  await attach('directorate_branches', id, 'photos', b.photo_url);
}
console.log(`branches: ${ds.branches.length} processed`);

console.log(`\n${DRY ? '[dry run] ' : ''}created ${stats.created}, updated ${stats.updated}, skipped ${stats.skipped}, files uploaded ${stats.files}`);
if (!WITH_FILES) console.log('(logos and photos not uploaded — re-run with --files to fetch and attach them)');

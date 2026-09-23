/**
 * Deletes the `directorates` rows that are not institutions.
 *
 * The scrape that populated this collection followed ministry websites and, in
 * sixteen cases, turned a page into a record: navigation crumbs ("اقسام
 * الدائرة", "دوائر مقر الوزارة"), a job title ("مدير المديرية"), a staff
 * handbook, a page of legislation, and one news headline ("دائرة رعاية
 * القاصرين تكرم عددا من المتفوقين القاصرين في محافظة المثنى").
 *
 * They are identified the same way `fix-directorate-titles.mjs` identifies
 * them — a record whose `title_en` still holds Arabic and has no entry in the
 * translation file, plus the explicit `clear` list — rather than from a list of
 * ids pasted in here, so the two scripts cannot drift apart.
 *
 * Before deleting anything it checks what points at each row. `procedures` and
 * `directorate_branches` both hold a *required* relation to a directorate, so
 * deleting a referenced row would either cascade or leave a broken record; any
 * row with references is reported and skipped rather than forced.
 *
 * Every row it deletes is written to a JSON file first, so the deletion can be
 * undone by re-creating from that file.
 *
 *   PB_URL=... PB_EMAIL=... PB_PASSWORD=... node pocketbase/seed/delete-nonInstitution-directorates.mjs [--apply]
 *
 * Without `--apply` it prints what it would delete and writes nothing.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const URL_BASE = process.env.PB_URL;
const EMAIL = process.env.PB_EMAIL;
const PASSWORD = process.env.PB_PASSWORD;
const APPLY = process.argv.includes('--apply');

for (const [name, value] of Object.entries({ PB_URL: URL_BASE, PB_EMAIL: EMAIL, PB_PASSWORD: PASSWORD })) {
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
}

let token = '';

async function api(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (token) headers.Authorization = token;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(URL_BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(json).slice(0, 300)}`);
  return json;
}

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const TRANSLATIONS = read('./directorate-titles-en.json');
const AUDIT = read('./directorate-titles-audit.json');
const hasArabic = (s) => /[؀-ۿ]/.test(s ?? '');

const auth = await api('/api/collections/_superusers/auth-with-password', {
  method: 'POST',
  body: { identity: EMAIL, password: PASSWORD },
});
token = auth.token;

const { items } = await api('/api/collections/directorates/records?perPage=500');

const doomed = items.filter(
  (record) =>
    (hasArabic(record.title_en) && TRANSLATIONS[record.title_ar] === undefined) ||
    AUDIT.clear.includes(record.title_ar),
);

console.log(`${items.length} directorates, ${doomed.length} of them not institutions`);

/** Collections whose records point at a directorate, and whether that link is required. */
const REFERRERS = [
  { collection: 'procedures', field: 'directorate', required: true },
  { collection: 'directorate_branches', field: 'directorate', required: true },
  { collection: 'comments', field: 'directorate', required: false },
  { collection: 'reviews', field: 'directorate', required: false },
];

const deletable = [];
const referenced = [];

for (const record of doomed) {
  const found = [];
  for (const { collection, field, required } of REFERRERS) {
    const filter = encodeURIComponent(`${field} = ${JSON.stringify(record.id)}`);
    const { totalItems } = await api(
      `/api/collections/${collection}/records?perPage=1&fields=id&filter=${filter}`,
    );
    if (totalItems > 0) found.push(`${totalItems} ${collection}${required ? ' (required)' : ''}`);
  }
  if (found.length) referenced.push({ record, found });
  else deletable.push(record);
}

for (const record of deletable) console.log(`  delete  ${record.slug}  —  ${record.title_ar.slice(0, 50)}`);
for (const { record, found } of referenced) {
  console.log(`  SKIP    ${record.slug}  —  referenced by ${found.join(', ')}`);
}

if (!APPLY) {
  console.log(`\nDry run: would delete ${deletable.length}, skip ${referenced.length}. Re-run with --apply.`);
} else if (deletable.length) {
  const backup = new URL('../../pb-deleted-directorates-backup.json', import.meta.url);
  writeFileSync(backup, JSON.stringify(deletable, null, 1), 'utf8');
  console.log(`\nFull records written to pb-deleted-directorates-backup.json`);

  let done = 0;
  for (const record of deletable) {
    await api(`/api/collections/directorates/records/${record.id}`, { method: 'DELETE' });
    done += 1;
  }
  console.log(`Deleted ${done} records.`);
  if (referenced.length) console.log(`Skipped ${referenced.length} that are still referenced.`);
}

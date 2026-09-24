/**
 * Repairs `title_en` on the `directorates` collection.
 *
 * Two problems, both introduced when scraped data replaced the seed:
 *
 * 1. 202 records carried the Arabic name in `title_en`. The scrape had no
 *    English name for them, and the importer copied the Arabic across rather
 *    than leaving the field empty — so the records looked translated and the
 *    admin's missing-language indicator had nothing to flag.
 * 2. 128 records took their English name from a Google Maps place match. That
 *    match returns the English label of whichever nearby place matched, not a
 *    translation, so many named a *different* institution: the Public
 *    Prosecution Directorate as "Supreme Judicial Council of Iraq", Halabja's
 *    education directorate as "General Directorate of Arbil Education", the
 *    petrochemical company as "State Company for Electrical and Electronic
 *    Industries". On a portal that tells citizens which office to visit, that
 *    is worse than showing them an Arabic name.
 *
 * The replacements are translations of the Arabic, reviewed one by one — they
 * are not the bodies' registered English names, and staff should treat them as
 * a starting point rather than as authoritative.
 *
 * Sixteen records are not institutions at all but scraped page titles, nav
 * crumbs and in one case a news headline ("دائرة رعاية القاصرين تكرم عددا من
 * المتفوقين..."). No English name is invented for them. `title_en` is required
 * by the collection schema, so they cannot be blanked either — they are left
 * exactly as they are and listed at the end. They want deleting, which is a
 * separate decision and not one this script should make.
 *
 *   PB_URL=... PB_EMAIL=... PB_PASSWORD=... node pocketbase/seed/fix-directorate-titles.mjs [--apply]
 *
 * Without `--apply` it prints what it would change and writes nothing.
 */
import { readFileSync } from 'node:fs';

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

const r = await api('/api/collections/_superusers/auth-with-password', {
  method: 'POST',
  body: { identity: EMAIL, password: PASSWORD },
});
token = r.token;

const { items } = await api('/api/collections/directorates/records?perPage=500&fields=id,slug,title_ar,title_en');
console.log(`${items.length} directorates`);

const planned = [];
const notInstitutions = [];

for (const record of items) {
  const current = record.title_en ?? '';
  let next;

  if (hasArabic(current)) {
    // Group 1: the Arabic name was copied into the English field.
    next = TRANSLATIONS[record.title_ar];
    if (next === undefined) {
      notInstitutions.push(record);
      continue;
    }
  } else if (AUDIT.clear.includes(record.title_ar)) {
    notInstitutions.push(record);
    continue;
  } else if (Object.hasOwn(AUDIT.replace, record.title_ar)) {
    // Group 2: a place match named something else.
    next = AUDIT.replace[record.title_ar];
  } else {
    continue;
  }

  if (next !== current) planned.push({ record, next });
}

console.log(`${planned.length} records to update; ${notInstitutions.length} left alone as non-institutions`);
for (const { record, next } of planned.slice(0, 8)) {
  console.log(`  ${record.title_ar.slice(0, 38)}\n    ${JSON.stringify(record.title_en)} -> ${JSON.stringify(next)}`);
}
if (planned.length > 8) console.log(`  ... and ${planned.length - 8} more`);

if (!APPLY) {
  console.log('\nDry run. Re-run with --apply to write.');
} else {
  let done = 0;
  for (const { record, next } of planned) {
    await api(`/api/collections/directorates/records/${record.id}`, {
      method: 'PATCH',
      body: { title_en: next },
    });
    done += 1;
    if (done % 50 === 0) console.log(`  ${done}/${planned.length}`);
  }
  console.log(`\nUpdated ${done} records.`);
}

if (notInstitutions.length) {
  console.log(`\n${notInstitutions.length} records are not institutions — scraped page titles and nav crumbs.`);
  console.log('No English name was invented for them, and `title_en` is required so it cannot');
  console.log('be blanked. They are unchanged, and want reviewing for deletion:');
  for (const record of notInstitutions) console.log(`  ${record.slug}  —  ${record.title_ar}`);
}

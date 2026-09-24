// Seeds the Irshad PocketBase instance. Idempotent: existing records are PATCHed.
//
// DEVELOPMENT DATA. It invents partners, comments and reviews to give the admin
// something to moderate, and every one of them is a statement about the world
// that is not true: six real organisations — a UN agency among them — listed as
// partners of a site affiliated with nobody, and comments making specific claims
// about real government offices. All of that was live on the public instance for
// months before anyone noticed, and had to be deleted by hand
// (`purge-seed-content.mjs`). Hence the guard below.
import { provinces, ministries, directorates, branches, tags } from './data-core.mjs';
import { procedures, procedureItems, files } from './data-procedures.mjs';
import {
  users, faq, slider, team, partners, settings, navigation,
  comments, reviews, contact, SEED_PASSWORD,
} from './data-site.mjs';

const URL_BASE = process.env.PB_URL;
const EMAIL = process.env.PB_EMAIL;
const PASSWORD = process.env.PB_PASSWORD;

for (const [name, value] of Object.entries({ PB_URL: URL_BASE, PB_EMAIL: EMAIL, PB_PASSWORD: PASSWORD, SEED_PASSWORD })) {
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
}

// Refuse to write invented content to anything that is not a local instance.
// `--i-know-this-is-not-local` is deliberately awkward to type: there is no
// ordinary reason to seed a deployed backend, and the cost of doing it by
// accident is fabricated partners and reviews on a public government guide.
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]']);
const targetHost = (() => {
  try { return new URL(URL_BASE).hostname; } catch { return ''; }
})();
if (!LOCAL_HOSTS.has(targetHost) && !process.argv.includes('--i-know-this-is-not-local')) {
  console.error(`Refusing to seed ${URL_BASE}: this writes development data, including`);
  console.error('invented partners, comments and reviews, and that is not a local instance.');
  console.error('Pass --i-know-this-is-not-local if you really mean it.');
  process.exit(1);
}

let token = '';

async function api(path, { method = 'GET', body, raw } = {}) {
  const headers = {};
  if (token) headers.Authorization = token;
  let payload = body;
  if (body && !raw) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(URL_BASE + path, { method, headers, body: payload });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!res.ok) {
    const err = new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(json).slice(0, 400)}`);
    err.status = res.status;
    throw err;
  }
  return json;
}

async function login() {
  const r = await api('/api/collections/_superusers/auth-with-password', {
    method: 'POST', body: { identity: EMAIL, password: PASSWORD },
  });
  token = r.token;
}

// ---------- asset generation ----------

const svg = (s) => Buffer.from(s, 'utf8');

function crest(initials, colour) {
  return svg(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
<rect width="300" height="300" rx="24" fill="${colour}"/>
<circle cx="150" cy="118" r="52" fill="none" stroke="#F4E9C8" stroke-width="6"/>
<path d="M150 74 l13 27 30 4 -22 21 5 30 -26 -14 -26 14 5 -30 -22 -21 30 -4z" fill="#F4E9C8"/>
<rect x="60" y="196" width="180" height="4" fill="#F4E9C8"/>
<text x="150" y="248" font-family="Helvetica,Arial,sans-serif" font-size="52" font-weight="bold"
 fill="#F4E9C8" text-anchor="middle">${initials}</text></svg>`);
}

function banner(title, subtitle, colour) {
  const esc = (s) => s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
  return svg(`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="600" viewBox="0 0 1600 600">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="${colour}"/><stop offset="1" stop-color="#0B1D2A"/></linearGradient></defs>
<rect width="1600" height="600" fill="url(#g)"/>
<g opacity="0.14" fill="none" stroke="#F4E9C8" stroke-width="2">
<circle cx="1320" cy="300" r="180"/><circle cx="1320" cy="300" r="130"/><circle cx="1320" cy="300" r="80"/></g>
<rect x="120" y="196" width="72" height="6" fill="#F4E9C8"/>
<text x="120" y="290" font-family="Helvetica,Arial,sans-serif" font-size="58" font-weight="bold"
 fill="#FFFFFF">${esc(title)}</text>
<text x="120" y="346" font-family="Helvetica,Arial,sans-serif" font-size="28"
 fill="#D8E2E8">${esc(subtitle)}</text></svg>`);
}

function avatar(initials, colour) {
  return svg(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
<rect width="400" height="400" fill="${colour}"/>
<circle cx="200" cy="158" r="62" fill="#F4E9C8" opacity="0.92"/>
<path d="M78 400c0-70 55-118 122-118s122 48 122 118z" fill="#F4E9C8" opacity="0.92"/>
<text x="200" y="176" font-family="Helvetica,Arial,sans-serif" font-size="46" font-weight="bold"
 fill="${colour}" text-anchor="middle">${initials}</text></svg>`);
}

function wordmark(name, colour) {
  const esc = (s) => s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
  const words = name.split(' ');
  const l1 = words.slice(0, Math.ceil(words.length / 2)).join(' ');
  const l2 = words.slice(Math.ceil(words.length / 2)).join(' ');
  return svg(`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="240" viewBox="0 0 480 240">
<rect width="480" height="240" fill="#FFFFFF"/>
<rect x="24" y="24" width="10" height="192" fill="${colour}"/>
<text x="58" y="112" font-family="Helvetica,Arial,sans-serif" font-size="30" font-weight="bold"
 fill="${colour}">${esc(l1)}</text>
<text x="58" y="152" font-family="Helvetica,Arial,sans-serif" font-size="30" font-weight="bold"
 fill="${colour}">${esc(l2)}</text></svg>`);
}

function makePdf(lines) {
  const esc = (s) => s.replace(/([()\\])/g, '\\$1');
  const content = lines
    .map((l, i) => `BT /F1 ${i === 0 ? 17 : 11} Tf 56 ${776 - i * 26} Td (${esc(l)}) Tj ET`)
    .join('\n');
  const objs = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>',
    '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>',
    `<</Length ${content.length}>>\nstream\n${content}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach((o, i) => { offsets.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => { pdf += String(o).padStart(10, '0') + ' 00000 n \n'; });
  pdf += `trailer\n<</Size ${objs.length + 1}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

const PALETTE = ['#1B5E4B', '#123A63', '#6B2737', '#4A3B76', '#8A5A1E', '#1F5673', '#5C3A21'];
const initials = (s) => s.replace(/[^A-Za-z ]/g, '').split(/\s+/).filter(Boolean)
  .filter((w) => !['of', 'and', 'the', 'for', 'Region', 'Kurdistan'].includes(w))
  .slice(0, 3).map((w) => w[0].toUpperCase()).join('');

// ---------- record writing ----------

async function exists(collection, id) {
  try { await api(`/api/collections/${collection}/records/${id}`); return true; }
  catch (e) { if (e.status === 404) return false; throw e; }
}

function clean(rec) {
  const out = {};
  for (const [k, v] of Object.entries(rec)) {
    if (k.startsWith('_')) continue;
    out[k] = v;
  }
  return out;
}

async function write(collection, rec, attachments) {
  const data = clean(rec);
  const id = data.id;
  const isUpdate = await exists(collection, id);
  const path = isUpdate
    ? `/api/collections/${collection}/records/${id}`
    : `/api/collections/${collection}/records`;
  const method = isUpdate ? 'PATCH' : 'POST';

  if (!attachments?.length) {
    await api(path, { method, body: data });
    return isUpdate ? 'updated' : 'created';
  }

  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) {
    if (Array.isArray(v)) { v.forEach((x) => fd.append(k, String(x))); continue; }
    fd.append(k, v === null || v === undefined ? '' : String(v));
  }
  for (const a of attachments) {
    fd.append(a.field, new Blob([a.content], { type: a.type }), a.filename);
  }
  await api(path, { method, body: fd, raw: true });
  return isUpdate ? 'updated' : 'created';
}

async function writeAll(collection, records, attachmentsFor) {
  let created = 0, updated = 0;
  for (const rec of records) {
    const r = await write(collection, rec, attachmentsFor?.(rec));
    if (r === 'created') created++; else updated++;
  }
  console.log(`  ${collection.padEnd(22)} ${String(records.length).padStart(3)} records  (${created} created, ${updated} updated)`);
}

// ---------- run ----------

async function main() {
  await login();
  console.log('Authenticated. Seeding:\n');

  await writeAll('users', users);
  await writeAll('provinces', provinces);

  await writeAll('ministries', ministries, (m) => [{
    field: 'logo', filename: `${m.slug}.svg`, type: 'image/svg+xml',
    content: crest(initials(m.title_en), PALETTE[ministries.indexOf(m) % PALETTE.length]),
  }]);

  await writeAll('directorates', directorates, (d) => [{
    field: 'logo', filename: `${d.slug}.svg`, type: 'image/svg+xml',
    content: crest(initials(d.title_en), PALETTE[directorates.indexOf(d) % PALETTE.length]),
  }]);

  await writeAll('directorate_branches', branches);
  await writeAll('tags', tags);
  await writeAll('procedures', procedures);
  await writeAll('procedure_items', procedureItems);

  await writeAll('files', files, (f) => [{
    field: 'document', filename: `${f._key}.pdf`, type: 'application/pdf',
    content: makePdf([
      f.title_en,
      'Republic of Iraq - Irshad Guide to Government Services',
      '',
      'This is a sample form generated for the Irshad development',
      'environment. It stands in for the official document published',
      'by the responsible directorate.',
      '',
      'Applicant name: ......................................',
      'National ID number: ..................................',
      'Date: ................................................',
      'Signature: ...........................................',
    ]),
  }]);

  await writeAll('faq', faq);

  await writeAll('slider', slider, (s) => [{
    field: 'image', filename: `slide-${s.sort_order}.svg`, type: 'image/svg+xml',
    content: banner(s.title_en, s.subtitle_en, s._colour),
  }]);

  await writeAll('team', team, (t) => [{
    field: 'photo', filename: `team-${t.sort_order}.svg`, type: 'image/svg+xml',
    content: avatar(initials(t.name_en.replace(/^(Dr|Judge)\.?\s*/, '')), PALETTE[t.sort_order % PALETTE.length]),
  }]);

  await writeAll('partners', partners, (p) => [{
    field: 'logo', filename: `partner-${p.sort_order}.svg`, type: 'image/svg+xml',
    content: wordmark(p.name_en, p._colour),
  }]);

  await writeAll('settings', settings);
  await writeAll('navigation', navigation);
  await writeAll('comments', comments);
  await writeAll('reviews', reviews);
  await writeAll('contact', contact);

  console.log(`\nSeeded accounts share the password: ${SEED_PASSWORD}`);
}

main().catch((e) => { console.error('\nFAILED:', e.message); process.exit(1); });

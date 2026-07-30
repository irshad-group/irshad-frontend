/**
 * Read-path checks for the admin dashboard.
 *
 * Mints real PocketBase sessions and requests pages over HTTP, so the session
 * cookie, the role gate and every list view are exercised without a browser.
 * The write path is covered separately by `e2e/admin.mjs`.
 *
 *   BASE_URL=http://localhost:3000 PB_URL=... SEED_PASSWORD=... node e2e/admin-read.mjs
 *
 * Expects the seeded development dataset (see pocketbase/seed).
 */
import PocketBase from 'pocketbase';

const APP = process.env.BASE_URL ?? 'http://localhost:3000';
const PB = process.env.PB_URL;
const PW = process.env.SEED_PASSWORD;

let pass = 0, fail = 0;
const check = (label, ok, detail = '') => {
  if (ok) { pass++; console.log(`  PASS  ${label}`); }
  else { fail++; console.log(`  FAIL  ${label}  ${detail}`); }
};

/** Signs in against PocketBase and returns the cookie value our app stores. */
async function sessionCookie(email) {
  const pb = new PocketBase(PB);
  pb.autoCancellation(false);
  await pb.collection('users').authWithPassword(email, PW);
  const serialised = pb.authStore.exportToCookie({ httpOnly: true }, 'pb_auth');
  const value = decodeURIComponent(serialised.slice(serialised.indexOf('=') + 1).split(';')[0]);
  return `pb_auth=${encodeURIComponent(value)}`;
}

async function get(path, cookie) {
  const res = await fetch(APP + path, {
    headers: cookie ? { cookie } : {},
    redirect: 'manual',
  });
  const body = res.status === 200 ? await res.text() : '';
  return { status: res.status, body, location: res.headers.get('location') };
}

const COLLECTIONS = [
  'procedures', 'procedure_items', 'files', 'tags',
  'ministries', 'directorates', 'directorate_branches', 'provinces',
  'slider', 'faq', 'team', 'partners', 'navigation', 'settings',
  'users', 'comments', 'reviews', 'contact',
];

const ADMIN_ONLY = new Set(['provinces', 'settings', 'users']);

async function main() {
  const admin = await sessionCookie('zaid.alrubaie@irshad.gov.iq');
  const mod = await sessionCookie('noor.alsaadi@irshad.gov.iq');
  const citizen = await sessionCookie('mustafa.kareem@example.iq');

  console.log('\nSession and role gate');
  {
    const r = await get('/en/admin', admin);
    check('admin reaches the dashboard', r.status === 200, `status=${r.status}`);
    check('dashboard greets the signed-in user', r.body.includes('Zaid Al-Rubaie'), '');
  }
  {
    const r = await get('/en/admin', mod);
    check('moderator reaches the dashboard', r.status === 200, `status=${r.status}`);
  }
  {
    const r = await get('/en/admin', citizen);
    check('citizen account gets 404, not 403', r.status === 404, `status=${r.status}`);
  }
  {
    const r = await get('/en/admin', 'pb_auth=garbage');
    check('a forged cookie does not grant access', r.status === 404, `status=${r.status}`);
  }

  console.log('\nAdmin-only sections are invisible to moderators');
  for (const name of ADMIN_ONLY) {
    const a = await get(`/en/admin/${name}`, admin);
    const m = await get(`/en/admin/${name}`, mod);
    check(`${name}: admin 200 / moderator 404`, a.status === 200 && m.status === 404,
      `admin=${a.status} mod=${m.status}`);
  }
  {
    const r = await get('/en/admin', mod);
    const leaks = [...ADMIN_ONLY].filter((n) => r.body.includes(`/admin/${n}"`));
    check('moderator sidebar omits admin-only links', leaks.length === 0, leaks.join(','));
  }

  console.log('\nEvery collection list renders');
  for (const name of COLLECTIONS) {
    const r = await get(`/en/admin/${name}`, admin);
    check(`list: ${name}`, r.status === 200, `status=${r.status}`);
  }

  console.log('\nList content is real');
  {
    const r = await get('/en/admin/procedures', admin);
    check('procedures list shows a seeded title',
      r.body.includes('Renew an Iraqi Passport'), '');
    check('procedures list resolves the directorate relation',
      r.body.includes('General Directorate of Passports'), '');
    check('procedures list shows translation completeness',
      r.body.includes('All languages present'), '');
  }
  {
    const r = await get('/en/admin/procedures?q=passport', admin);
    check('search filters the list', r.body.includes('Renew an Iraqi Passport'), '');
    const r2 = await get('/en/admin/procedures?q=zzzznotathing', admin);
    check('search with no match shows the empty state',
      r2.body.includes('Nothing to show yet'), '');
  }

  console.log('\nEdit forms');
  {
    const r = await get('/en/admin/procedures/prc000000000001', admin);
    check('edit form loads a record', r.status === 200, `status=${r.status}`);
    check('form renders all three language inputs',
      r.body.includes('title_en') && r.body.includes('title_ar') && r.body.includes('title_ku'), '');
    check('relation picker is populated',
      r.body.includes('General Directorate of Passports'), '');
    check('delete control is offered', r.body.includes('Delete'), '');
  }
  {
    const r = await get('/en/admin/procedures/new', admin);
    check('create form loads', r.status === 200, `status=${r.status}`);
  }
  {
    const r = await get('/en/admin/procedures/doesnotexist1', admin);
    check('unknown record id 404s', r.status === 404, `status=${r.status}`);
  }
  {
    const r = await get('/en/admin/not_a_collection', admin);
    check('unknown collection 404s', r.status === 404, `status=${r.status}`);
  }

  console.log('\nModeration queue');
  {
    const r = await get('/en/admin', admin);
    check('dashboard lists a pending comment',
      r.body.includes('Is the one million dinar minimum capital'), '');
    check('dashboard lists a pending review',
      r.body.includes('Helpful, though agents vary'), '');
  }

  console.log('\nLocalised admin chrome');
  {
    const ar = await get('/ar/admin', admin);
    const ku = await get('/ku/admin', admin);
    check('Arabic admin renders RTL', ar.status === 200 && ar.body.includes('dir="rtl"'),
      `status=${ar.status}`);
    check('Arabic admin uses Arabic chrome', ar.body.includes('لوحة المعلومات'), '');
    check('Kurdish admin uses Kurdish chrome', ku.body.includes('داشبۆرد'), '');
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error('ERROR:', e); process.exit(1); });

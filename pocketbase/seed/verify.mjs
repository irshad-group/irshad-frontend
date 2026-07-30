// Exercises the PocketBase API rules as an anonymous visitor, an end user,
// and a moderator, to confirm authorization is enforced server-side.
const BASE = process.env.PB_URL;

async function call(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (token) headers.Authorization = token;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(BASE + path, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  let json = {};
  try { json = await res.json(); } catch { /* empty body */ }
  return { status: res.status, json };
}

async function authAs(collection, identity, password) {
  const r = await call(`/api/collections/${collection}/auth-with-password`, {
    method: 'POST', body: { identity, password },
  });
  if (!r.json.token) throw new Error(`auth failed for ${identity}: ${JSON.stringify(r.json)}`);
  return r.json.token;
}

let pass = 0, fail = 0;
function check(label, ok, detail = '') {
  if (ok) { pass++; console.log(`  PASS  ${label}`); }
  else { fail++; console.log(`  FAIL  ${label}  ${detail}`); }
}
const blocked = (s) => s === 400 || s === 403 || s === 404;

const PW = process.env.SEED_PASSWORD;
if (!PW) { console.error('Missing required environment variable: SEED_PASSWORD'); process.exit(1); }

async function main() {
  const su = await authAs('_superusers', process.env.PB_EMAIL, process.env.PB_PASSWORD);
  const user = await authAs('users', 'mustafa.kareem@example.iq', PW);
  const mod = await authAs('users', 'noor.alsaadi@irshad.gov.iq', PW);
  const admin = await authAs('users', 'zaid.alrubaie@irshad.gov.iq', PW);

  console.log('\nPublic read access (anonymous)');
  {
    const r = await call('/api/collections/procedures/records?perPage=1');
    check('anonymous can list procedures', r.status === 200 && r.json.totalItems === 15,
      `status=${r.status} total=${r.json.totalItems}`);
  }
  {
    const r = await call('/api/collections/settings/records?perPage=1');
    check('anonymous can read settings', r.status === 200 && r.json.totalItems === 12,
      `total=${r.json.totalItems}`);
  }
  {
    const r = await call('/api/collections/ministries/records?perPage=1');
    check('anonymous can list ministries', r.status === 200 && r.json.totalItems === 14,
      `total=${r.json.totalItems}`);
  }

  console.log('\nModeration gates');
  {
    const r = await call('/api/collections/comments/records?perPage=50');
    const total = r.json.totalItems;
    check('anonymous sees only approved comments (6 of 8)', total === 6, `total=${total}`);
  }
  {
    const r = await call('/api/collections/comments/records?perPage=50', { token: mod });
    check('moderator sees all comments (8)', r.json.totalItems === 8, `total=${r.json.totalItems}`);
  }
  {
    const r = await call('/api/collections/reviews/records?perPage=50');
    check('anonymous sees only approved reviews (9 of 10)', r.json.totalItems === 9,
      `total=${r.json.totalItems}`);
  }

  console.log('\nContact messages are write-only for the public');
  // A non-null list rule is applied as a filter, so a blocked reader gets an
  // empty set rather than a 403. What matters is that no row comes back.
  {
    const r = await call('/api/collections/contact/records');
    const one = await call('/api/collections/contact/records/cnt000000000001');
    check('anonymous sees no contact messages', r.json.totalItems === 0 && one.status === 404,
      `total=${r.json.totalItems} view=${one.status}`);
  }
  {
    const r = await call('/api/collections/contact/records', { token: user });
    const one = await call('/api/collections/contact/records/cnt000000000001', { token: user });
    check('end user sees no contact messages', r.json.totalItems === 0 && one.status === 404,
      `total=${r.json.totalItems} view=${one.status}`);
  }
  {
    const r = await call('/api/collections/contact/records', { token: mod });
    check('moderator can list contact messages', r.status === 200, `status=${r.status}`);
  }
  {
    const r = await call('/api/collections/contact/records', {
      method: 'POST',
      body: { first_name: 'Test', last_name: 'Visitor', email: 't@example.iq', message: 'rule check', status: 'new' },
    });
    check('anonymous can submit a contact message', r.status === 200, `status=${r.status}`);
    if (r.json.id) await call(`/api/collections/contact/records/${r.json.id}`, { method: 'DELETE', token: su });
  }

  console.log('\nPrivilege escalation');
  {
    const r = await call('/api/collections/users/records/usr000000000006', {
      method: 'PATCH', token: user, body: { role: 'admin' },
    });
    check('end user cannot promote themselves to admin', blocked(r.status), `status=${r.status}`);
  }
  {
    const r = await call('/api/collections/users/records/usr000000000006', {
      method: 'PATCH', token: user, body: { job_title: 'Citizen' },
    });
    check('end user can still edit their own profile', r.status === 200, `status=${r.status}`);
  }
  {
    const r = await call('/api/collections/users/records', {
      method: 'POST',
      body: { email: 'escalate@example.iq', password: PW, passwordConfirm: PW, full_name: 'Esc', role: 'admin' },
    });
    check('signup cannot self-assign the admin role', blocked(r.status), `status=${r.status}`);
  }

  console.log('\nContent write access');
  {
    const r = await call('/api/collections/procedures/records', {
      method: 'POST', token: user,
      body: { slug: 'rogue', title_en: 'Rogue', title_ar: 'Rogue', directorate: 'dir000000000001' },
    });
    check('end user cannot create a procedure', blocked(r.status), `status=${r.status}`);
  }
  {
    const r = await call('/api/collections/procedures/records/prc000000000001', {
      method: 'PATCH', token: mod, body: { sort_order: 1 },
    });
    check('moderator can edit a procedure', r.status === 200, `status=${r.status}`);
  }
  {
    const r = await call('/api/collections/procedures/records/prc000000000015', {
      method: 'DELETE', token: mod,
    });
    check('moderator cannot delete a procedure', blocked(r.status), `status=${r.status}`);
  }

  console.log('\nComment submission rules');
  let newCommentId;
  {
    const r = await call('/api/collections/comments/records', {
      method: 'POST', token: user,
      body: { body: 'Self-approved comment', author: 'usr000000000006', procedure: 'prc000000000001', approved: true },
    });
    check('user cannot publish a self-approved comment', blocked(r.status), `status=${r.status}`);
  }
  {
    const r = await call('/api/collections/comments/records', {
      method: 'POST', token: user,
      body: { body: 'Pending comment', author: 'usr000000000006', procedure: 'prc000000000001' },
    });
    newCommentId = r.json.id;
    check('user can submit a comment for moderation', r.status === 200 && r.json.approved === false,
      `status=${r.status}`);
  }
  {
    const r = await call('/api/collections/comments/records', {
      method: 'POST', token: user,
      body: { body: 'Impersonation', author: 'usr000000000007', procedure: 'prc000000000001' },
    });
    check('user cannot post a comment as another user', blocked(r.status), `status=${r.status}`);
  }
  if (newCommentId) {
    const r = await call(`/api/collections/comments/records/${newCommentId}`, {
      method: 'PATCH', token: user, body: { approved: true },
    });
    check('user cannot approve their own pending comment', blocked(r.status), `status=${r.status}`);
    await call(`/api/collections/comments/records/${newCommentId}`, { method: 'DELETE', token: su });
  }

  console.log('\nArchive / publish visibility');
  {
    await call('/api/collections/procedures/records/prc000000000015', {
      method: 'PATCH', token: su, body: { archived: true },
    });
    const anon = await call('/api/collections/procedures/records?perPage=1');
    const staff = await call('/api/collections/procedures/records?perPage=1', { token: mod });
    check('archived procedure hidden from the public', anon.json.totalItems === 14, `total=${anon.json.totalItems}`);
    check('archived procedure still visible to staff', staff.json.totalItems === 15, `total=${staff.json.totalItems}`);

    const items = await call('/api/collections/procedure_items/records?perPage=1');
    check('items of an archived procedure are hidden too', items.json.totalItems === 61,
      `total=${items.json.totalItems}`);
    const fl = await call('/api/collections/files/records?perPage=1');
    check('forms attached to an archived procedure are hidden', fl.json.totalItems === 15,
      `total=${fl.json.totalItems}`);

    await call('/api/collections/procedures/records/prc000000000015', {
      method: 'PATCH', token: su, body: { archived: false },
    });
  }

  console.log('\nData integrity');
  {
    const r = await call('/api/collections/reviews/records', {
      method: 'POST', token: user,
      body: { rating: 5, body: 'duplicate', author: 'usr000000000006', procedure: 'prc000000000001' },
    });
    check('a user cannot review the same procedure twice', blocked(r.status), `status=${r.status}`);
  }
  {
    const r = await call('/api/collections/reviews/records', {
      method: 'POST', token: user,
      body: { rating: 9, body: 'out of range', author: 'usr000000000006', procedure: 'prc000000000003' },
    });
    check('rating outside 1–5 is rejected', blocked(r.status), `status=${r.status}`);
  }
  {
    const r = await call('/api/collections/procedures/records', {
      method: 'POST', token: admin,
      body: { slug: 'renew-iraqi-passport', title_en: 'Dup', title_ar: 'Dup', directorate: 'dir000000000001' },
    });
    check('duplicate procedure slug is rejected', blocked(r.status), `status=${r.status}`);
  }

  console.log('\nRelational integrity (expand)');
  {
    const r = await call('/api/collections/procedures/records/prc000000000001?expand=directorate.ministry,tags');
    const d = r.json.expand?.directorate;
    check('procedure expands to directorate and its ministry',
      d?.title_en === 'General Directorate of Passports' && d?.expand?.ministry?.title_en === 'Ministry of Interior',
      JSON.stringify(d?.title_en));
    check('procedure expands its tags', (r.json.expand?.tags || []).length === 2,
      `tags=${(r.json.expand?.tags || []).length}`);
  }
  {
    const r = await call('/api/collections/procedure_items/records?filter=' +
      encodeURIComponent('procedure="prc000000000001"') + '&sort=sort_order');
    check('procedure 1 has its 5 ordered steps', r.json.totalItems === 5, `total=${r.json.totalItems}`);
  }
  {
    const r = await call('/api/collections/files/records/fil000000000001');
    check('form record carries an uploaded PDF', !!r.json.document && r.json.document.endsWith('.pdf'),
      r.json.document);
  }
  {
    const r = await call('/api/collections/ministries/records/min000000000001');
    check('ministry carries an uploaded logo', !!r.json.logo, r.json.logo);
  }

  console.log('\nTrilingual completeness');
  {
    const r = await call('/api/collections/procedures/records?perPage=50');
    const missing = r.json.items.filter((p) => !p.title_en || !p.title_ar || !p.title_ku);
    check('every procedure has all three titles', missing.length === 0,
      missing.map((m) => m.slug).join(','));
  }
  {
    const r = await call('/api/collections/procedure_items/records?perPage=100');
    const missing = r.json.items.filter((p) => !p.title_ku || !p.description_ku);
    check('every procedure step has Kurdish content', missing.length === 0, `${missing.length} missing`);
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });

#!/usr/bin/env node
/**
 * Clear settings whose link no longer exists.
 *
 * The footer carries whatever URLs the `settings` collection holds. Two of them
 * came from the development seed and point at accounts nobody ever created —
 * `x.com/irshad_iq` and `youtube.com/@irshad-iq`, both 404 — so every page of a
 * government services guide ended in two dead links.
 *
 * The footer already drops a social entry with an empty value, so clearing the
 * setting removes the link cleanly rather than leaving a gap or a stray
 * separator. The key stays, so staff can fill it in from the admin the day the
 * account exists.
 *
 * Checks rather than assumes. Only an unambiguous 404 or 410 counts as dead:
 * a login wall, a 403, a redirect or a timeout all mean "cannot tell from here",
 * and those are reported and left alone. Facebook answers a logged-out request
 * with a login page, which proves nothing either way — so a Facebook link is
 * never removed by this.
 *
 * Usage:
 *   PB_URL=... PB_EMAIL=... PB_PASSWORD=... node pocketbase/seed/clear-dead-links.mjs [--dry-run]
 */

const DRY = process.argv.includes('--dry-run');
const { PB_URL, PB_EMAIL, PB_PASSWORD } = process.env;
if (!PB_URL || !PB_EMAIL || !PB_PASSWORD) {
  console.error('PB_URL, PB_EMAIL and PB_PASSWORD must all be set.');
  process.exit(1);
}
const BASE = PB_URL.replace(/\/$/, '');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)'
  + ' Chrome/126.0.0.0 Safari/537.36';

async function api(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${init.method || 'GET'} ${path} -> ${res.status} ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

/** `dead`, `alive`, or `unknown` — anything but `dead` is left alone. */
async function probe(url) {
  try {
    const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': UA } });
    if (res.status === 404 || res.status === 410) return { verdict: 'dead', detail: String(res.status) };
    if (res.ok) return { verdict: 'alive', detail: String(res.status) };
    return { verdict: 'unknown', detail: `${res.status} at ${new URL(res.url).host}` };
  } catch (error) {
    return { verdict: 'unknown', detail: error.message.slice(0, 40) };
  }
}

const auth = await api('/api/collections/_superusers/auth-with-password', {
  method: 'POST',
  body: JSON.stringify({ identity: PB_EMAIL, password: PB_PASSWORD }),
});
const H = { Authorization: auth.token };

const { items } = await api('/api/collections/settings/records?perPage=200', { headers: H });
const linkSettings = items.filter((s) => /^https?:\/\//i.test(String(s.value_en ?? '').trim())
  || /^https?:\/\//i.test(String(s.value_ar ?? '').trim()));

let cleared = 0;
for (const setting of linkSettings) {
  // Link settings are `no_trans`, so the value lives in the English column.
  const field = /^https?:\/\//i.test(String(setting.value_en ?? '').trim()) ? 'value_en' : 'value_ar';
  const url = String(setting[field]).trim();
  const { verdict, detail } = await probe(url);
  const line = `  ${setting.key.padEnd(16)} ${verdict.padEnd(8)} ${detail.padEnd(22)} ${url}`;

  if (verdict !== 'dead') { console.log(line); continue; }
  console.log(`${line}   <- ${DRY ? 'would clear' : 'cleared'}`);
  cleared += 1;
  if (DRY) continue;
  await api(`/api/collections/settings/records/${setting.id}`, {
    method: 'PATCH',
    headers: H,
    body: JSON.stringify({ [field]: '' }),
  });
}

console.log(`\n${DRY ? 'Would clear' : 'Cleared'} ${cleared} of ${linkSettings.length} link setting(s).`);
if (DRY) console.log('--dry-run: nothing written.');

// Google Maps place lookup via the endpoint the Maps web app itself calls.
// The `pb` template was captured from a real browser session (see pb.txt).
// Responses are cached on disk so re-runs are free.
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const PB = fs.readFileSync(path.join(HERE, 'pb.txt'), 'utf8').trim();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const CACHE = path.join(HERE, 'cache-gmaps');
fs.mkdirSync(CACHE, { recursive: true });
const keyOf = (s) => s.replace(/[^a-zA-Z0-9؀-ۿ]+/g, '_').slice(0, 120);

function curl(args) {
  return new Promise((res) => {
    execFile('curl', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
      (err, stdout) => res(err && !stdout ? '' : stdout));
  });
}

async function raw(query, lang) {
  const f = path.join(CACHE, `${lang}_${keyOf(query)}.json`);
  if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8');
  const url = `https://www.google.com/search?tbm=map&authuser=0&hl=${lang}&gl=iq`
    + `&q=${encodeURIComponent(query)}&pb=${PB}`;
  let body = '';
  for (let attempt = 0; attempt < 3 && !body; attempt++) {
    body = await curl(['-s', '--max-time', '45', '-A', UA, '-H', `Accept-Language: ${lang}`, url]);
    if (!body && attempt < 2) await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
  }
  fs.writeFileSync(f, body);
  return body;
}

function firstPhoto(node, depth = 0) {
  if (depth > 14) return null;
  if (typeof node === 'string') {
    return /^https:\/\/lh\d\.googleusercontent\.com\/(p|gps-cs|gps-proxy)/.test(node) ? node : null;
  }
  if (Array.isArray(node)) for (const c of node) { const r = firstPhoto(c, depth + 1); if (r) return r; }
  return null;
}

function place(p) {
  if (!Array.isArray(p)) return null;
  const o = {};
  o.name = typeof p[11] === 'string' ? p[11] : null;
  if (!o.name) return null;
  o.address = typeof p[18] === 'string' ? p[18] : null;
  o.address_lines = Array.isArray(p[2]) ? p[2].filter((x) => typeof x === 'string') : [];
  if (Array.isArray(p[9])) { o.lat = p[9][2] ?? null; o.lon = p[9][3] ?? null; }
  o.ftid = typeof p[10] === 'string' ? p[10] : null;
  o.website = Array.isArray(p[7]) && typeof p[7][0] === 'string' ? p[7][0] : null;
  if (Array.isArray(p[178]) && Array.isArray(p[178][0])) {
    const e = p[178][0];
    const variants = Array.isArray(e[1]) ? e[1] : [];
    const intl = variants.find((v) => Array.isArray(v) && /^\+/.test(v[0]));
    o.phone = intl ? intl[0] : (typeof e[0] === 'string' ? e[0] : null);
  }
  o.categories = Array.isArray(p[13]) ? p[13].filter((x) => typeof x === 'string') : [];
  o.rating = Array.isArray(p[4]) ? (p[4][7] ?? null) : null;
  o.reviews = Array.isArray(p[4]) ? (p[4][8] ?? null) : null;
  o.hours = Array.isArray(p[34]) && Array.isArray(p[34][1])
    ? p[34][1].map((d) => (Array.isArray(d) ? [d[0], Array.isArray(d[1]) ? d[1].join(', ') : null] : null)).filter(Boolean)
    : null;
  o.photo = firstPhoto(p[37]) || firstPhoto(p[51]) || firstPhoto(p[72]) || null;
  if (o.ftid) o.maps_url = `https://www.google.com/maps/place/?q=place_id:${o.ftid}`;
  if (o.lat != null) o.maps_geo_url = `https://www.google.com/maps/search/?api=1&query=${o.lat},${o.lon}`;
  return o;
}

export async function search(query, { lang = 'ar', limit = 30 } = {}) {
  let body = await raw(query, lang);
  if (!body) return [];
  body = body.replace(/^\)\]\}'\s*/, '');
  let j;
  try { j = JSON.parse(body); } catch (e) { return []; }
  // Place tuples land in different slots for single-match vs list answers,
  // so walk the whole tree rather than hard-coding an index path.
  const out = [];
  const seen = new Set();
  (function walk(n, d) {
    if (d > 10 || !Array.isArray(n)) return;
    if (typeof n[11] === 'string' && Array.isArray(n[9]) && typeof n[9][2] === 'number') {
      const p = place(n);
      if (p) {
        const k = p.ftid || `${p.name}@${p.lat},${p.lon}`;
        if (!seen.has(k)) { seen.add(k); out.push(p); }
      }
      return;
    }
    for (const c of n) walk(c, d + 1);
  })(j, 0);
  return out.slice(0, limit);
}

/** Run `fn` over `items` with at most `n` in flight. */
export async function pool(items, n, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      try { results[i] = await fn(items[i], i); } catch (e) { results[i] = null; }
    }
  }));
  return results;
}

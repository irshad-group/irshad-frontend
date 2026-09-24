// HTTP fetcher for the .gov.iq / gov.krd estate.
// Two quirks it works around:
//  * the local resolver hijacks several .gov.iq zones -> retry pinned to a DoH answer
//  * gov.krd (and some others) 403 a bare curl -> send a full browser header set
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const CACHE = path.join(HERE, 'cache-http');
fs.mkdirSync(CACHE, { recursive: true });

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const HEADERS = [
  '-A', UA,
  '-H', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  '-H', 'Accept-Language: en-US,en;q=0.9,ar;q=0.8,ckb;q=0.7',
  '-H', 'Sec-Fetch-Dest: document',
  '-H', 'Sec-Fetch-Mode: navigate',
  '-H', 'Sec-Fetch-Site: none',
  '-H', 'Upgrade-Insecure-Requests: 1',
];

const dohCache = new Map();
export function resolve(host) {
  if (dohCache.has(host)) return dohCache.get(host);
  let ips = [];
  try {
    const out = execFileSync('curl', ['-s', '--max-time', '10',
      `https://dns.google/resolve?name=${host}&type=A`], { encoding: 'utf8' });
    ips = (JSON.parse(out).Answer || []).filter((a) => a.type === 1).map((a) => a.data);
  } catch (e) { /* offline or NXDOMAIN */ }
  dohCache.set(host, ips);
  return ips;
}

const keyOf = (s) => s.replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 150);

export function get(url, { timeout = 30, cache = true } = {}) {
  const f = path.join(CACHE, `${keyOf(url)}.html`);
  if (cache && fs.existsSync(f)) {
    return { status: '200', url, html: fs.readFileSync(f, 'utf8'), cached: true };
  }
  let host;
  try { host = new URL(url).host; } catch (e) { return { status: '0', url, html: '' }; }
  const base = ['-s', '-L', '--compressed', '--max-time', String(timeout), ...HEADERS,
    '-w', '\n@@HTTP@@%{http_code}@@%{url_effective}'];
  const attempts = [base];
  const ips = resolve(host);
  if (ips.length) {
    attempts.push([...base, '--resolve', `${host}:443:${ips[0]}`, '--resolve', `${host}:80:${ips[0]}`]);
  }
  for (const args of attempts) {
    let body = '';
    try {
      body = execFileSync('curl', [...args, url], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    } catch (e) { continue; }
    const i = body.lastIndexOf('\n@@HTTP@@');
    const html = i >= 0 ? body.slice(0, i) : body;
    const meta = i >= 0 ? body.slice(i + 9).split('@@') : ['0', ''];
    if (/securegateway\.com/.test(meta[1] || '')) continue;   // ISP interception page
    if (['200', '301', '302'].includes(meta[0]) && html.length > 500) {
      if (cache) fs.writeFileSync(f, html);
      return { status: meta[0], url: meta[1] || url, html };
    }
  }
  if (cache) fs.writeFileSync(f, '');
  return { status: '0', url, html: '' };
}

export function txt(h) {
  return h
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (m, d) => String.fromCharCode(+d))
    .replace(/\s+/g, ' ').trim();
}

export function links(html, pageUrl) {
  const out = [];
  for (const a of html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]{0,200}?)<\/a>/gi)) {
    let href;
    try { href = new URL(a[1], pageUrl).href; } catch (e) { continue; }
    out.push({ href, label: txt(a[2]) });
  }
  return out;
}

export function extract(html, pageUrl) {
  const out = {};
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (t) out.title = txt(t[1]);
  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (og) { try { out.og_image = new URL(og[1], pageUrl).href; } catch (e) { /* bad url */ } }
  const icon = html.match(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i);
  if (icon) { try { out.icon = new URL(icon[1], pageUrl).href; } catch (e) { /* bad url */ } }
  const logo = html.match(/<img[^>]+(?:class|id|alt)=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i)
    || html.match(/<img[^>]+src=["']([^"']*logo[^"']*)["']/i);
  if (logo) { try { out.logo = new URL(logo[1], pageUrl).href; } catch (e) { /* bad url */ } }

  const flat = txt(html);
  const em = new Set();
  for (const m of html.matchAll(/mailto:([^"'?>\s]+)/gi)) em.add(decodeURIComponent(m[1]).toLowerCase());
  for (const m of flat.matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.(?:iq|krd|com|org|net|gov)\b/gi)) em.add(m[0].toLowerCase());
  out.emails = [...em].filter((e) => !/\.(png|jpe?g|gif|webp|svg)$/.test(e) && !/example|sentry|wixpress/.test(e)).slice(0, 15);

  const ph = new Set();
  for (const m of html.matchAll(/tel:([+0-9()\-\s]{6,})/gi)) ph.add(m[1].trim());
  for (const m of flat.matchAll(/\+964[\s-]?\d{1,3}[\s-]?\d{3}[\s-]?\d{3,4}/g)) ph.add(m[0].trim());
  for (const m of flat.matchAll(/\b07[3-9]\d[\s-]?\d{3}[\s-]?\d{4}\b/g)) ph.add(m[0].trim());
  out.phones = [...ph].map((p) => p.replace(/\s+/g, ' ')).slice(0, 25);

  const co = new Set();
  for (const m of html.matchAll(/!3d(-?\d+\.\d+)[^0-9]{0,40}?!2d(-?\d+\.\d+)/g)) co.add(`${m[1]},${m[2]}`);
  for (const m of html.matchAll(/!2d(-?\d+\.\d+)!3d(-?\d+\.\d+)/g)) co.add(`${m[2]},${m[1]}`);
  for (const m of html.matchAll(/@(-?\d{1,2}\.\d{4,}),(-?\d{1,3}\.\d{4,})/g)) co.add(`${m[1]},${m[2]}`);
  for (const m of html.matchAll(/[?&]q=(-?\d{1,2}\.\d{4,})(?:,|%2C)(-?\d{1,3}\.\d{4,})/gi)) co.add(`${m[1]},${m[2]}`);
  out.coords = [...co].filter((c) => {
    const [a, b] = c.split(',').map(Number);
    return a > 28 && a < 38 && b > 38 && b < 49;
  }).slice(0, 6);

  const so = new Set();
  for (const m of html.matchAll(/https?:\/\/(?:www\.)?(?:facebook|twitter|x|instagram|youtube|t\.me|linkedin)\.com\/[^"'\s<>)]+/gi)) so.add(m[0]);
  out.social = [...so].slice(0, 10);
  return out;
}

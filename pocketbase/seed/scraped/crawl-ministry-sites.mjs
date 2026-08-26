#!/usr/bin/env node
/**
 * Harvest candidate offices from the Defence and Industry ministries' own sites.
 *
 * These two are the ministries Google Maps and OpenStreetMap cannot cover:
 * military sites are deliberately absent from public maps, and the state
 * industrial companies each trade under their own name rather than as a branch
 * of a ministry, so searching for "وزارة الصناعة" finds none of them. What both
 * do have is their own websites — twenty-three company sites in Industry's
 * case, each publishing its factories, plants and marketing centres, often with
 * a Google Maps link the company placed there itself.
 *
 * This stage only harvests candidates: a name, whatever address, phone and map
 * link sit beside it, and the page it came from. Turning those into located
 * offices is the next stage's job, so a bad crawl can be re-run without
 * spending Maps requests.
 *
 *   node crawl-ministry-sites.mjs
 *
 * Output: ministry-site-candidates.json
 */
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { get } from './fetch.mjs';

const DIR = JSON.parse(fs.readFileSync('iraq-government-directory.json', 'utf8'));

const clean = (h) => h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|tr|td|h\d)>/gi, '\n')
  .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
  .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();

const anchors = (html, base) => [...(html || '').matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]{0,300}?)<\/a>/gi)]
  .map((m) => {
    let href;
    try { href = new URL(m[1], base).toString(); } catch { return null; }
    return { href, text: m[2].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() };
  })
  .filter(Boolean);

// Arabic letters are not ASCII word characters, so `\b` never fires after one.
// Every keyword pattern here anchors on whitespace or a string edge instead —
// the first version of this used `\b` and matched nothing at all.
const FACILITY = /^(مصنع|معمل|مصانع|معامل|مركز|مراكز|شعبة|فرع|فروع|مقر|مختبر|مستودع|منشأة|محطة|مجمع|أكاديمية|اكاديمية|جامعة|كلية|مدرسة|هيئة|دائرة|مديرية|ادارة|إدارة)(?=\s|$)/;
/** Pages worth following: an index of facilities, or somewhere an address lives. */
const FOLLOW = /(مصانع|معامل|المصانع|المعامل|فروع|الفروع|اتصل|تواصل|المراكز|مراكز|مواقع|الاقسام|الأقسام|عن الشركة|نبذة|هيكل|دليل)|\/(factories|factory|branches|contact|categories|about|centers?|marketing)(\/|\?|$)/i;
const MAPLINK = /(maps\.app\.goo\.gl|goo\.gl\/maps|google\.[a-z.]+\/maps|maps\.google)/i;

const PHONE = /(?:\+?964|00964|0)\s?7\d{2}[\s-]?\d{3}[\s-]?\d{3,4}/g;
const EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const PAGES_PER_SITE = 18;

/** Follow a Google short link to whatever it finally points at. */
const resolvedCache = new Map();
function resolveMap(url) {
  if (resolvedCache.has(url)) return resolvedCache.get(url);
  let out = null;
  try {
    const head = execFileSync('curl', ['-sIL', '--max-time', '25', '-A', 'Mozilla/5.0', url], { encoding: 'utf8' });
    const hops = [...head.matchAll(/^location:\s*(\S+)/gim)].map((m) => m[1]);
    const final = decodeURIComponent(hops.pop() || url);
    const at = final.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || final.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    const q = final.match(/[?&]q=([^&]+)/);
    out = {
      final,
      lat: at ? Number(at[1]) : null,
      lon: at ? Number(at[2]) : null,
      label: q && !at ? q[1].replace(/\+/g, ' ').trim() : null,
      ftid: (final.match(/[?&]ftid=([^&]+)/) || [])[1] || null,
    };
  } catch {
    out = null;
  }
  resolvedCache.set(url, out);
  return out;
}

/**
 * Coordinates the site itself plots on a map.
 *
 * Several of these sites draw their facilities with Leaflet from an inline
 * array of `{ name, lat, lng }`. That is the best source in the whole exercise:
 * first-party, exact, and it names every site the company runs — the cement
 * company alone plots 21. Worth a dedicated pass, because the markup around it
 * gives no hint the data is there.
 */
function harvestPlotted(html) {
  const re = /\{\s*name\s*:\s*["'`]([^"'`]{3,90})["'`]\s*,\s*lat(?:itude)?\s*:\s*(-?\d+\.\d+)\s*,\s*(?:lng|lon|longitude)\s*:\s*(-?\d+\.\d+)/g;
  return [...(html || '').matchAll(re)].map((m) => ({
    name: m[1].trim(),
    lat: Number(m[2]),
    lon: Number(m[3]),
    via: 'plotted',
  }));
}

/** Every candidate office one page mentions. */
function harvest(page) {
  const found = harvestPlotted(page.html);
  const text = clean(page.html || '');

  // 1. Links whose own text names a facility.
  for (const a of anchors(page.html, page.url)) {
    if (FACILITY.test(a.text) && a.text.length <= 70) {
      found.push({ name: a.text, page: a.href, via: 'link' });
    }
  }

  // 2. Maps links the organisation placed itself. Their own text is always just
  //    "الموقع الجغرافي", so the name is the line of prose the link interrupts.
  for (const m of (page.html || '').matchAll(/<a[^>]+href="([^"]+)"[^>]*>[\s\S]{0,120}?<\/a>/gi)) {
    if (!MAPLINK.test(m[1])) continue;
    const before = clean((page.html || '').slice(Math.max(0, m.index - 600), m.index));
    const line = before.split('\n').filter(Boolean).pop() || '';
    found.push({ name: line.replace(/^[•\-*\s]+/, '').slice(0, 90), map: m[1], via: 'map-link' });
  }

  // 3. Bulleted or line-leading facility names in prose.
  for (const raw of text.split('\n')) {
    const line = raw.replace(/^[•\-*\s]+/, '').trim();
    if (line.length < 6 || line.length > 110) continue;
    if (!FACILITY.test(line)) continue;
    found.push({ name: line, via: 'text' });
  }

  const phones = [...new Set(text.match(PHONE) || [])];
  const emails = [...new Set((page.html || '').match(EMAIL) || [])].filter((e) => !/\.(png|jpg|gif|jpeg)$/i.test(e));
  return { found, phones, emails };
}

function crawl(site) {
  let host;
  try { host = new URL(site).host; } catch { return []; }
  const queue = [{ url: site, depth: 0 }];
  const visited = new Set();
  const pages = [];
  while (queue.length && pages.length < PAGES_PER_SITE) {
    const { url, depth } = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);
    const r = get(url, { timeout: 40 });
    if (String(r.status) !== '200' || !r.html) continue;
    pages.push({ url, html: r.html });
    if (depth >= 2) continue;
    for (const a of anchors(r.html, url)) {
      let h;
      try { h = new URL(a.href); } catch { continue; }
      if (h.host !== host || visited.has(a.href)) continue;
      if (!FOLLOW.test(a.text) && !FOLLOW.test(h.pathname + h.search)) continue;
      queue.push({ url: a.href, depth: depth + 1 });
    }
  }
  return pages;
}

const TARGETS = [
  ...DIR.directorates
    .filter((d) => d.ministry_slug === 'ministry-of-industry-and-minerals' && d.website)
    .map((d) => ({
      ministry: 'ministry-of-industry-and-minerals',
      directorate: d.slug,
      title: d.title_ar,
      site: d.website,
    })),
  {
    ministry: 'ministry-of-industry-and-minerals',
    directorate: null,
    title: 'وزارة الصناعة والمعادن',
    site: 'https://industry.gov.iq/',
  },
  { ministry: 'ministry-of-defence', directorate: null, title: 'وزارة الدفاع', site: 'https://mod.mil.iq/' },
];

const out = [];
for (const target of TARGETS) {
  const pages = crawl(target.site);
  const all = [];
  const phones = new Set();
  const emails = new Set();
  for (const page of pages) {
    const h = harvest(page);
    all.push(...h.found.map((f) => ({ ...f, source: page.url })));
    h.phones.forEach((p) => phones.add(p));
    h.emails.forEach((e) => emails.add(e));
  }

  // One entry per distinct name, keeping the richest version of each.
  const byName = new Map();
  for (const c of all) {
    const key = c.name.replace(/\s+/g, ' ').trim();
    if (!key) continue;
    const prev = byName.get(key);
    // Keep whichever mention carries the most: plotted coordinates beat a map
    // link, a map link beats a bare name.
    const better = !prev
      || (c.lat != null && prev.lat == null)
      || (c.map && !prev.map && prev.lat == null);
    if (better) byName.set(key, { ...prev, ...c, name: key });
  }
  const candidates = [...byName.values()];
  for (const c of candidates) if (c.map) c.resolved = resolveMap(c.map);

  out.push({ ...target, pages: pages.length, phones: [...phones], emails: [...emails], candidates });
  console.log(`${String(candidates.length).padStart(3)} candidates (${String(pages.length).padStart(2)} pages,`
    + ` ${candidates.filter((c) => c.map).length} with a map link)  ${target.title.slice(0, 44)}`);
}

fs.writeFileSync('ministry-site-candidates.json', JSON.stringify(out, null, 1));
const total = out.reduce((s, o) => s + o.candidates.length, 0);
const mapped = out.reduce((s, o) => s + o.candidates.filter((c) => c.resolved).length, 0);
console.log(`\nTotal: ${total} candidates, ${mapped} with a resolved map link.`);

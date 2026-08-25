// Walk each ministry site looking for the names of its constituent bodies
// (دائرة / مديرية / هيئة / الشركة العامة / بەڕێوەبەرایەتی / directorate / department).
import fs from 'node:fs';
import path from 'node:path';
import { get, txt, links, extract } from './fetch.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const mins = JSON.parse(fs.readFileSync(path.join(HERE, 'ministries-enriched.json'), 'utf8'));

// Pages likely to enumerate the ministry's bodies.
const STRUCTURE = /(تشكيلات|التشكيلات|الدوائر|دوائر|الهيكل|هيكلية|هيكل|اقسام|الاقسام|الشركات|المديريات|مديريات|الهيئات|departments?|directorates?|structure|organi[sz]ation|entities|our-|about)/i;
// A link label that names a body. Note: no \b — JS word boundaries are ASCII-only
// and would never fire after an Arabic or Kurdish letter.
const BODY = new RegExp(
  '(?:^|\\s|\\u060C)('
  + 'دائرة|الدائرة|دوائر|مديرية|المديرية|مديريات|هيئة|الهيئة|الشركة العامة|شركة عامة|'
  + 'وكالة|الوكالة|صندوق|الصندوق|جهاز|الجهاز|سلطة|السلطة|'
  + 'بەڕێوەبەرایەتی|فەرمانگەی|دەستەی|ئاژانسی|'
  + 'general directorate|directorate|department|general company|state company|'
  + 'authority|commission|agency|fund'
  + ')(?=\\s|$|\\u060C)', 'i');
const NOISE = /(اخبار|أخبار|news|فيديو|video|صور|gallery|تويتر|facebook|instagram|youtube|login|search|rss|\.pdf$|\.jpg$|\.png$|mailto:|tel:|javascript:)/i;

function harvest(html, url) {
  const found = new Map();
  for (const { href, label } of links(html, url)) {
    if (NOISE.test(href) || NOISE.test(label)) continue;
    const l = label.replace(/\s+/g, ' ').trim();
    if (l.length < 6 || l.length > 160) continue;
    if (!BODY.test(l)) continue;
    if (!found.has(l)) found.set(l, href);
  }
  // Some sites list bodies as plain text in a <li> rather than as links.
  for (const m of html.matchAll(/<li[^>]*>([\s\S]{0,220}?)<\/li>/gi)) {
    const l = txt(m[1]).replace(/\s+/g, ' ').trim();
    if (l.length < 8 || l.length > 160) continue;
    if (!BODY.test(l)) continue;
    if (!found.has(l)) found.set(l, null);
  }
  return found;
}

const result = [];
for (const m of mins) {
  if (!m.website) { result.push({ ...m, bodies: [] }); console.log(`SKIP ${m.slug} (no site)`); continue; }
  const home = get(m.website);
  if (!home.html) { result.push({ ...m, bodies: [], site_status: 'unreachable' }); console.log(`DOWN ${m.slug}`); continue; }

  const bodies = harvest(home.html, home.url);
  const host = new URL(home.url).host;

  // Follow up to 6 structure-ish pages on the same host.
  const pages = [];
  for (const { href, label } of links(home.html, home.url)) {
    if (pages.length >= 6) break;
    if (NOISE.test(href)) continue;
    let u; try { u = new URL(href); } catch (e) { continue; }
    if (u.host !== host) continue;
    if (!STRUCTURE.test(decodeURIComponent(u.pathname)) && !STRUCTURE.test(label)) continue;
    if (pages.includes(u.href) || u.href === home.url) continue;
    pages.push(u.href);
  }
  for (const p of pages) {
    const r = get(p, { timeout: 25 });
    if (!r.html) continue;
    for (const [k, v] of harvest(r.html, r.url)) if (!bodies.has(k)) bodies.set(k, v);
  }

  const meta = extract(home.html, home.url);
  const rec = {
    slug: m.slug, krg: m.krg, website: m.website,
    site_logo: meta.logo || meta.og_image || meta.icon || null,
    site_emails: meta.emails || [], site_phones: meta.phones || [],
    site_coords: meta.coords || [], site_social: meta.social || [],
    structure_pages: pages,
    bodies: [...bodies].map(([name, url]) => ({ name, url })),
  };
  result.push(rec);
  console.log(`${m.slug.padEnd(58)} bodies=${String(rec.bodies.length).padStart(3)} pages=${pages.length} em=${rec.site_emails.length} ph=${rec.site_phones.length}`);
}
fs.writeFileSync(path.join(HERE, 'directorates-discovered.json'), JSON.stringify(result, null, 2));
const total = result.reduce((a, r) => a + (r.bodies?.length || 0), 0);
console.log(`\nTOTAL candidate bodies: ${total}`);

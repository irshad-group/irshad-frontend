// Look every directorate up on Google Maps for coordinates, phone, photo, address.
// Gap-seeded names are kept only if Maps confirms them; site-scraped names are kept
// either way (the ministry published them) but carry verified:false.
import fs from 'node:fs';
import path from 'node:path';
import { search, pool } from './gmaps.mjs';
import { scorePlace, tokens, norm } from './match.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const clean = JSON.parse(fs.readFileSync(path.join(HERE, 'directorates-clean.json'), 'utf8'));
const gaps = JSON.parse(fs.readFileSync(path.join(HERE, 'seed-gap-directorates.json'), 'utf8'));
const mins = JSON.parse(fs.readFileSync(path.join(HERE, 'ministries-enriched.json'), 'utf8'));
const minBySlug = Object.fromEntries(mins.map((m) => [m.slug, m]));

const items = [
  ...clean.map((r) => ({ ...r, source: 'ministry-site' })),
  ...Object.entries(gaps).filter(([k]) => !k.startsWith('_')).flatMap(([slug, names]) =>
    names.map((name) => ({ ministry_slug: slug, krg: !!minBySlug[slug]?.krg, name, url: null, source: 'seed' }))),
];

// A harvested href is only a website if it is a page. Ministry sites link straight
// at Word documents and at bare '#' anchors from dropdown menus; neither is one.
const siteLink = (u) => (
  u && /^https?:\/\//.test(u)
  && !/\.(jpe?g|png|gif|webp|svg|pdf|docx?|xlsx?|pptx?|zip|rar)(\?|$)/i.test(u)
  && !/#$/.test(u)
    ? u : null);

const WEAK = new Set(['العامة', 'العام', 'الوزارة', 'الفنية', 'الادارية', 'المالية', 'القانونية']);
const mustFor = (name) => {
  const t = tokens(name).filter((w) => !WEAK.has(w));
  return t.length ? t.slice(0, 2) : tokens(name).slice(0, 1);
};

/** How much of the requested name actually shows up in the matched place name. */
function confidence(title, mapsName) {
  const a = new Set(tokens(title));
  const b = norm(mapsName);
  if (!a.size) return 0;
  let hit = 0;
  for (const w of a) if (b.includes(w)) hit += 1;
  return +(hit / a.size).toFixed(2);
}

let done = 0;
const results = await pool(items, 6, async (it) => {
  const m = minBySlug[it.ministry_slug];
  const where = it.krg ? 'اربيل اقليم كردستان' : 'بغداد العراق';
  const qs = [`${it.name} ${where}`];
  if (!/بغداد|اربيل|البصرة|الموصل|السليمانية|دهوك|حلبجة/.test(it.name)) {
    qs.push(`${it.name} ${m ? m.title_ar.split('—')[0].trim() : ''} ${where}`.replace(/\s+/g, ' '));
  }
  const map = new Map();
  for (const q of qs) {
    for (const p of await search(q, { lang: 'ar' })) {
      const k = p.ftid || `${p.name}@${p.lat}`;
      if (!map.has(k)) map.set(k, p);
    }
  }
  const ranked = [...map.values()]
    .map((p) => ({ p, s: scorePlace(p, { must: mustFor(it.name), krg: it.krg }) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s);
  const top = ranked[0]?.p ?? null;

  done += 1;
  if (done % 25 === 0) console.log(`  ... ${done}/${items.length}`);

  if (!top && it.source === 'seed') return null;   // unverified guess -> no record

  const conf = top ? confidence(it.name, top.name) : 0;
  // A weak name overlap means Maps handed back a different office; keep the
  // ministry-published name but drop the location rather than mislocate it.
  const trust = conf >= 0.5;
  return {
    ministry_slug: it.ministry_slug,
    krg: it.krg,
    title_ar: it.name,
    source: it.source,
    verified: !!top && trust,
    match_confidence: conf,
    website: siteLink(it.url),
    gps_lat: trust ? top?.lat ?? null : null,
    gps_lon: trust ? top?.lon ?? null : null,
    phone: trust ? top?.phone ?? null : null,
    address_ar: trust ? top?.address ?? null : null,
    photo: trust ? top?.photo ?? null : null,
    hours: trust ? top?.hours ?? null : null,
    maps_name: top?.name ?? null,
    maps_url: trust ? top?.maps_url ?? null : null,
    maps_website: trust ? top?.website ?? null : null,
    maps_rating: trust ? top?.rating ?? null : null,
    maps_categories: trust ? top?.categories ?? [] : [],
  };
});

const out = results.filter(Boolean);
fs.writeFileSync(path.join(HERE, 'directorates-enriched.json'), JSON.stringify(out, null, 2));
console.log(`\nkept ${out.length} / ${items.length}`);
console.log(`  located (conf>=0.5): ${out.filter((r) => r.gps_lat).length}`);
console.log(`  phone:               ${out.filter((r) => r.phone).length}`);
console.log(`  photo:               ${out.filter((r) => r.photo).length}`);
console.log(`  hours:               ${out.filter((r) => r.hours).length}`);
console.log(`  name-only (no gps):  ${out.filter((r) => !r.gps_lat).length}`);

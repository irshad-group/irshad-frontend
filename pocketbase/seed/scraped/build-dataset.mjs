// Fold every source into one dataset shaped like the Irshad PocketBase collections.
//
// Sources, in order of trust:
//   1. gov.krd / ministry websites  -> canonical names, official site URLs
//   2. ur.gov.iq /api/public/orgs   -> official ministry logos + en/ku names
//   3. Google Maps                  -> coordinates, phone, photo, address, hours
import fs from 'node:fs';
import path from 'node:path';
import { norm, stripTashkeel } from './match.mjs';
import { largePhoto } from './photo-url.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const rd = (f) => JSON.parse(fs.readFileSync(path.join(HERE, f), 'utf8'));

const mins = rd('ministries-enriched.json');
const dirs = rd('directorates-enriched.json');
const branches = fs.existsSync(path.join(HERE, 'branches-discovered.json')) ? rd('branches-discovered.json') : [];
const urOrgs = rd('orgs.json').data || rd('orgs.json');
const gis = (rd('gis.json').data || rd('gis.json'));
const fams = rd('branch-families.json');

// The bare /storage/ path serves the SPA shell; only /api/storage/ returns the image.
const UR_BASE = 'https://ur.gov.iq/api/';

// gov.krd serves the same government-wide emblem on every ministry microsite —
// the KRG does not publish per-ministry marks. Using it is what gov.krd itself
// shows, but the record says so rather than implying a ministry-specific logo.
const KRG_EMBLEM = 'https://gov.krd/media/1099/govkrdlogobig.svg';

// --- ministries -------------------------------------------------------------
// ur.gov.iq is the government's own registry; match on the Arabic name to lift
// its official logo and English/Kurdish names onto our record.
const urByName = new Map(urOrgs.map((o) => [norm(o.name), o]));
function urMatch(titleAr, krg) {
  // ur.gov.iq is the federal portal. A KRG ministry shares its Arabic name with
  // the federal one ("وزارة الداخلية"), so matching there would hand the Kurdistan
  // ministry the federal ministry's logo.
  if (krg) return null;
  const k = norm(titleAr.split('—')[0]);
  if (urByName.has(k)) return urByName.get(k);
  for (const [n, o] of urByName) {
    if (n.includes(k) || k.includes(n)) return o;
  }
  return null;
}

const clean = (s) => (s ? stripTashkeel(s).replace(/\s+/g, ' ').trim() : null);

// Maps returns "89XJ+2GR وزارة الصحة, Al Adham Street، بغداد" — the plus code is noise.
const cleanAddr = (s) => clean(s)?.replace(/^[0-9A-Z]{4,7}\+[0-9A-Z]{2,4}\s*/, '') || null;

const DAY = { 0: 'SUN', 1: 'MON', 2: 'TUE', 3: 'WED', 4: 'THU', 5: 'FRI', 6: 'SAT' };
const AR_DAY = { 'الأحد': 'SUN', 'الاحد': 'SUN', 'الاثنين': 'MON', 'الإثنين': 'MON', 'الثلاثاء': 'TUE', 'الأربعاء': 'WED', 'الاربعاء': 'WED', 'الخميس': 'THU', 'الجمعة': 'FRI', 'السبت': 'SAT' };
/** Maps hours -> the working_hours JSON shape the directorates collection already uses. */
function toWorkingHours(hours) {
  if (!Array.isArray(hours) || !hours.length) return null;
  const out = [];
  for (const [label, span] of hours) {
    const day = AR_DAY[clean(label)] || DAY[out.length] || null;
    if (!day) continue;
    if (!span || /مغلق|closed/i.test(span)) { out.push({ day, from: null, to: null }); continue; }
    const m = String(span).match(/(\d{1,2}[:.]\d{2})\s*[–\-—]\s*(\d{1,2}[:.]\d{2})/);
    if (m) out.push({ day, from: m[1].replace('.', ':'), to: m[2].replace('.', ':') });
    else out.push({ day, from: null, to: null, note: clean(String(span)) });
  }
  return out.length ? out : null;
}

const slugify = (s, fallback) => {
  const base = (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return base || fallback;
};

const ministries = mins.map((m, i) => {
  const ur = urMatch(m.title_ar, m.krg);
  return {
    slug: m.slug,
    title_ar: clean(m.title_ar),
    title_en: clean(m.title_en) || ur?.name_en || null,
    title_ku: clean(m.title_ku) || ur?.name_ku || null,
    krg: m.krg,
    website: m.website || null,
    phone: m.phone || null,
    email: null,
    address_ar: cleanAddr(m.address_ar),
    address_en: null,
    address_ku: null,
    gps_lat: m.gps_lat ?? null,
    gps_lon: m.gps_lon ?? null,
    logo_url: ur?.picture ? UR_BASE + ur.picture : (m.krg ? KRG_EMBLEM : null),
    photo_url: largePhoto(m.photo),
    place_id: m.maps_url?.match(/place_id:(.+)$/)?.[1] || null,
    maps_url: m.maps_url || null,
    sort_order: (i + 1) * 10,
    archived: false,
    _sources: {
      names: m.krg ? 'gov.krd' : 'ministry website / ar.wikipedia',
      logo: ur ? 'ur.gov.iq (official ministry logo)' : (m.krg ? 'gov.krd (shared KRG emblem, not ministry-specific)' : null),
      location: m.gps_lat ? 'google-maps' : null,
      maps_matched_name: m.maps_name || null,
    },
  };
});

// --- directorates -----------------------------------------------------------
const dirSlugs = new Set();
function uniqueSlug(base) {
  let s = base; let n = 2;
  while (dirSlugs.has(s)) { s = `${base}-${n++}`; }
  dirSlugs.add(s);
  return s;
}

const directorates = dirs.map((d, i) => {
  const base = slugify(d.maps_name && d.match_confidence >= 0.5 ? null : null, null)
    || slugify(`${d.ministry_slug}-${i}`, `dir-${i}`);
  return {
    slug: uniqueSlug(slugify(translit(d.title_ar), base)),
    ministry_slug: d.ministry_slug,
    title_ar: clean(d.title_ar),
    title_en: null,
    title_ku: null,
    // Provenance matters downstream: a website harvested from the ministry's own
    // site is the directorate's; one taken from a matched map place belongs to
    // whatever that place turned out to be.
    website: d.website || d.maps_website || null,
    _website_source: d.website ? 'ministry-site' : (d.maps_website ? 'place-match' : null),
    phone: d.phone || null,
    address_ar: cleanAddr(d.address_ar),
    gps_lat: d.gps_lat ?? null,
    gps_lon: d.gps_lon ?? null,
    photo_url: largePhoto(d.photo),
    working_hours: toWorkingHours(d.hours),
    place_id: d.maps_url?.match(/place_id:(.+)$/)?.[1] || null,
    maps_url: d.maps_url || null,
    sort_order: (i + 1) * 10,
    archived: false,
    _verified: d.verified,
    _confidence: d.match_confidence,
    _source: d.source,
    _maps_name: d.maps_name || null,
  };
});

// Very small Arabic -> Latin map, only good enough to make a readable URL slug.
function translit(ar) {
  const M = { 'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'ة': 'a', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ئ': 'y', 'ؤ': 'w', 'ء': '', 'ﻻ': 'la' };
  return stripTashkeel(ar).split('').map((c) => (M[c] !== undefined ? M[c] : (/[a-zA-Z0-9]/.test(c) ? c : ' '))).join('')
    .replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

// --- branches ---------------------------------------------------------------
// Every family has one canonical parent directorate with a fixed slug. Where the
// existing seed already uses that slug, the import updates that record rather
// than creating a near-duplicate beside it — which is what keeps the procedures
// already attached to it attached.
const famByKey = Object.fromEntries(fams.families.map((f) => [f.key, f]));

/**
 * Best scraped directorate to fill a family's canonical parent from.
 *
 * The hint alone is not enough. "دائرة صحة" matches every provincial health
 * directorate, so hint-matching handed the national parent the coordinates of
 * "دائرة صحة ديالى", and the foodstuff company a building in Basra. A national
 * body's details have to come from a row that is plausibly that body:
 *   - its title matches the canonical parent title, not merely the hint, and
 *   - it sits where the headquarters sits — Baghdad for a federal family.
 */
const BAGHDAD = (la, lo) => la > 32.9 && la < 33.6 && lo > 44.0 && lo < 44.8;
const NORTH = (la) => la > 34.8;

function candidatesFor(fam) {
  const hint = norm(fam.directorate_hint);
  const want = norm(fam.parent_title_ar);
  const krg = fam.ministry.startsWith('krg-');
  return directorates
    .filter((d) => d.ministry_slug === fam.ministry)
    .map((d) => {
      const t = norm(d.title_ar);
      const exact = t === want;
      if (!exact && !t.includes(hint)) return null;
      // A located candidate must be located *plausibly* to be usable.
      const located = d.gps_lat != null
        && (krg ? NORTH(d.gps_lat) : BAGHDAD(d.gps_lat, d.gps_lon));
      return { d, exact, located };
    })
    .filter(Boolean);
}

function scrapedFor(fam) {
  const c = candidatesFor(fam);
  if (!c.length) return null;
  // An exact-title, plausibly-located row first; then exact title; then nothing.
  // A hint-only match is allowed to name the parent but never to place it.
  return c.sort((a, b) => (b.exact - a.exact) || (b.located - a.located)
    || ((b.d.phone ? 1 : 0) - (a.d.phone ? 1 : 0)))[0];
}

const parents = new Map();
function parentFor(fam) {
  if (parents.has(fam.key)) return parents.get(fam.key);
  const pick = scrapedFor(fam);
  const src = pick?.d ?? null;
  const trustLocation = !!pick?.located;
  const rec = {
    slug: fam.parent_slug,
    ministry_slug: fam.ministry,
    title_ar: clean(fam.parent_title_ar),
    title_en: null, title_ku: null,
    website: src?.website ?? null,
    phone: src?.phone ?? null,
    address_ar: src?.address_ar ?? null,
    gps_lat: trustLocation ? src.gps_lat : null,
    gps_lon: trustLocation ? src.gps_lon : null,
    photo_url: trustLocation ? largePhoto(src.photo_url) : null,
    working_hours: trustLocation ? src.working_hours : null,
    place_id: trustLocation ? src.place_id : null,
    maps_url: trustLocation ? src.maps_url : null,
    sort_order: 5,
    archived: false,
    _verified: trustLocation,
    _confidence: src?._confidence ?? 0,
    _source: src
      ? `canonical-parent (${trustLocation ? 'details' : 'name only'} from ${src.slug})`
      : 'canonical-parent',
    _maps_name: src?._maps_name ?? null,
    _is_branch_parent: true,
  };
  // Absorb every row carrying the parent's own title. Removing only the one row the
  // details came from left the others behind, and the importer's KEEP_SLUGS maps by
  // title — so two rows resolved to one live slug and the second write silently
  // merged into the first, leaving one record with a phone from one building and
  // coordinates from another.
  const want = norm(rec.title_ar);
  for (let i = directorates.length - 1; i >= 0; i--) {
    const d = directorates[i];
    if (d === rec || d.ministry_slug !== fam.ministry) continue;
    if (norm(d.title_ar) !== want && d !== src) continue;
    if (d !== src && norm(d.title_ar) !== want) continue;
    // Keep anything the parent itself lacks.
    if (!rec.phone && d.phone) rec.phone = d.phone;
    if (!rec.website && d.website) rec.website = d.website;
    if (!rec.gps_lat && d.gps_lat != null
        && (fam.ministry.startsWith('krg-') ? NORTH(d.gps_lat) : BAGHDAD(d.gps_lat, d.gps_lon))) {
      rec.gps_lat = d.gps_lat; rec.gps_lon = d.gps_lon;
      rec.place_id = d.place_id; rec.maps_url = d.maps_url;
      rec.photo_url = rec.photo_url || largePhoto(d.photo_url);
      rec._source += ` + located from ${d.slug}`;
    }
    directorates.splice(i, 1);
  }
  directorates.push(rec);
  parents.set(fam.key, rec);
  return rec;
}

const branchRows = [];
for (const b of branches) {
  const fam = famByKey[b.family];
  if (!fam) continue;
  const parent = parentFor(fam);
  branchRows.push({
    directorate_slug: parent.slug,
    province_code: b.province_code,
    title_ar: clean(b.title_ar),
    // The family template ("Baghdad Passports Directorate") is identical for every
    // passport office in Baghdad, so it would label three different buildings the
    // same. Keep it as a grouping label only; the record's own name is the Arabic one.
    title_en: null,
    title_ku: null,
    group_label_en: b.title_en,
    address_ar: cleanAddr(b.address_ar),
    gps_lat: b.gps_lat, gps_lon: b.gps_lon,
    phone: b.phone || null,
    website: b.website || null,
    email: null,
    working_hours: toWorkingHours(b.hours),
    photo_url: largePhoto(b.photo),
    place_id: b.maps_url?.match(/place_id:(.+)$/)?.[1] || null,
    maps_url: b.maps_url || null,
    sort_order: 0,
    archived: false,
    _family: b.family,
    _source: 'google-maps',
  });
}
const synthesised = [...parents.values()];

// ur.gov.iq's own GIS layer: a handful of offices with government-published photos.
const gisRows = gis.map((g) => ({
  title_ar: clean(g.title),
  org_ar: clean(g.org?.name),
  city_ar: clean(g.city),
  gps_lat: g.lat ? +g.lat : null,
  gps_lon: g.long ? +g.long : null,
  description_ar: clean(g.description),
  photo_urls: (g.images || []).map((im) => UR_BASE + im.link),
  _source: 'ur.gov.iq/api/public/gis',
}));

// The importer remaps some slugs by Arabic title (KEEP_SLUGS) so it can update the
// development seed's rows in place. That remap can collapse two distinct dataset
// slugs onto one live record, where the second write merges into the first instead
// of replacing it. Catch it here rather than discovering it in the database.
const KEEP_TITLES = new Set([
  'المديرية العامة للجنسية', 'مديرية شؤون الجوازات العامة', 'مديرية المرور العامة',
  'مديرية الإقامة العامة', 'مديرية الاقامة العامة', 'دائرة الصحة العامة',
  'المديرية العامة لتربية بغداد الرصافة', 'دائرة الدراسات والتخطيط والمتابعة',
  'دائرة البعثات والعلاقات الثقافية', 'الهيئة العامة للضرائب', 'الهيئة العامة للكمارك',
  'هيئة التقاعد الوطنية', 'دائرة التسجيل العقاري', 'دائرة الكاتب العدل',
  'هيئة الحماية الاجتماعية', 'دائرة تسجيل الشركات', 'الشركة العامة لتجارة المواد الغذائية',
]);
const targets = new Map();
for (const d of directorates) {
  const key = KEEP_TITLES.has(d.title_ar) ? `title:${d.title_ar}` : `slug:${d.slug}`;
  if (!targets.has(key)) targets.set(key, []);
  targets.get(key).push(d.slug);
}
const collisions = [...targets].filter(([, v]) => v.length > 1);
if (collisions.length) {
  console.error('ERROR: these dataset rows would write to the same live record:');
  for (const [k, v] of collisions) console.error(`  ${k} <- ${v.join(', ')}`);
  process.exit(1);
}

const dataset = {
  generated: new Date().toISOString().slice(0, 10),
  sources: {
    ministries: 'gov.krd (KRG entities pages, 3 languages), ar.wikipedia + ministry websites (federal), ur.gov.iq /api/public/orgs (official logos, en/ku names)',
    directorates: 'ministry websites (structure pages), Google Maps (coordinates, phone, photo, address, hours)',
    branches: 'Google Maps, one query per directorate family per governorate, filtered by governorate bounding box',
    gis: 'ur.gov.iq /api/public/gis (government-published building photos)',
  },
  counts: {
    ministries: ministries.length,
    directorates: directorates.length,
    branches: branchRows.length,
    gis_locations: gisRows.length,
  },
  ministries,
  directorates,
  branches: branchRows,
  gis_locations: gisRows,
};

fs.writeFileSync(path.join(HERE, 'iraq-government-directory.json'), JSON.stringify(dataset, null, 2));

console.log('=== iraq-government-directory.json ===');
console.log(`ministries   ${ministries.length}  (gps ${ministries.filter((m) => m.gps_lat).length}, phone ${ministries.filter((m) => m.phone).length}, logo ${ministries.filter((m) => m.logo_url).length}, photo ${ministries.filter((m) => m.photo_url).length})`);
console.log(`directorates ${directorates.length}  (gps ${directorates.filter((d) => d.gps_lat).length}, phone ${directorates.filter((d) => d.phone).length}, photo ${directorates.filter((d) => d.photo_url).length}, hours ${directorates.filter((d) => d.working_hours).length}, synthesised parents ${synthesised.length})`);
console.log(`branches     ${branchRows.length}  (phone ${branchRows.filter((b) => b.phone).length}, photo ${branchRows.filter((b) => b.photo_url).length}, hours ${branchRows.filter((b) => b.working_hours).length})`);
console.log(`gis          ${gisRows.length}  (with photos ${gisRows.filter((g) => g.photo_urls.length).length})`);

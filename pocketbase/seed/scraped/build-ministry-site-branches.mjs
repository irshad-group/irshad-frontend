#!/usr/bin/env node
/**
 * Turn the crawl's candidates into located provincial offices.
 *
 * Defence and Industry are the two ministries the Maps and OSM passes could not
 * reach, for opposite reasons: military sites are deliberately absent from
 * public maps, and every state industrial company trades under its own name, so
 * nothing about "معمل سمنت كبيسة" says "Ministry of Industry" to a search engine.
 * Their own websites do say it, which is why this pass exists.
 *
 * The gate is positive, not a blacklist. A candidate becomes an office only if
 * it can be *placed*:
 *
 *   1. the site plots it on a map itself — exact, first-party coordinates;
 *   2. the site links it to Google Maps — resolved to a place and verified;
 *   3. its name carries an Iraqi city or governorate, which is then confirmed
 *      against Maps and must land in that governorate.
 *
 * Anything else is dropped. That throws away real facilities whose page never
 * says where they are, which is the right trade: a page heading like "مصانع
 * الشركة", a production line inside another plant, and a genuine factory all
 * look alike as bare strings, and inventing a location for the third would put
 * a reader in front of the wrong building.
 *
 *   node build-ministry-site-branches.mjs [--dry]
 *
 * Output: ministry-site-branches.json
 */
import fs from 'node:fs';
import { search, pool } from './gmaps.mjs';
import { norm, scorePlace, tokens } from './match.mjs';
import { provinceOf, inBox } from './province-box.mjs';
import { largePhoto } from './photo-url.mjs';

const DRY = process.argv.includes('--dry');
const CANDIDATES = JSON.parse(fs.readFileSync('ministry-site-candidates.json', 'utf8'));

/**
 * Iraqi cities and towns that name a governorate.
 *
 * Keyed by the normalised form, since these are matched against `norm()`ed
 * names. Only places distinctive enough to be unambiguous: "الشرقية" or
 * "الجديدة" name a district in half the governorates in the country.
 */
const CITY = {
  'بغداد': 'IQ-BG', 'الكاظميه': 'IQ-BG', 'الجادريه': 'IQ-BG', 'الدوره': 'IQ-BG', 'الوزيريه': 'IQ-BG',
  'البصره': 'IQ-BA', 'الزبير': 'IQ-BA', 'ام قصر': 'IQ-BA', 'شط العرب': 'IQ-BA',
  'الموصل': 'IQ-NI', 'نينوي': 'IQ-NI', 'سنجار': 'IQ-NI', 'بادوش': 'IQ-NI', 'الحدباء': 'IQ-NI',
  'الحدباه': 'IQ-NI', 'حمام العليل': 'IQ-NI', 'تلعفر': 'IQ-NI', 'بعشيقه': 'IQ-NI',
  'اربيل': 'IQ-AR', 'عنكاوه': 'IQ-AR', 'سوران': 'IQ-AR',
  'السليمانيه': 'IQ-SU', 'چمچمال': 'IQ-SU', 'رانيه': 'IQ-SU',
  'دهوك': 'IQ-DA', 'زاخو': 'IQ-DA', 'العماديه': 'IQ-DA',
  'حلبجه': 'IQ-HA',
  'كركوك': 'IQ-KI', 'الحويجه': 'IQ-KI', 'داقوق': 'IQ-KI',
  'الانبار': 'IQ-AN', 'الرمادي': 'IQ-AN', 'الفلوجه': 'IQ-AN', 'القائم': 'IQ-AN',
  'كبيسه': 'IQ-AN', 'هيت': 'IQ-AN', 'حديثه': 'IQ-AN', 'الحبانيه': 'IQ-AN',
  'بابل': 'IQ-BB', 'الحله': 'IQ-BB', 'المسيب': 'IQ-BB', 'المحاويل': 'IQ-BB',
  'كربلاء': 'IQ-KA', 'عين التمر': 'IQ-KA',
  'النجف': 'IQ-NA', 'الكوفه': 'IQ-NA', 'المشخاب': 'IQ-NA',
  'ديالي': 'IQ-DI', 'بعقوبه': 'IQ-DI', 'المقداديه': 'IQ-DI', 'خانقين': 'IQ-DI',
  'ذي قار': 'IQ-DQ', 'الناصريه': 'IQ-DQ', 'الشطره': 'IQ-DQ',
  'ميسان': 'IQ-MA', 'العماره': 'IQ-MA',
  'المثني': 'IQ-MU', 'السماوه': 'IQ-MU',
  'القادسيه': 'IQ-QA', 'الديوانيه': 'IQ-QA',
  'واسط': 'IQ-WA', 'الكوت': 'IQ-WA', 'النعمانيه': 'IQ-WA',
  'صلاح الدين': 'IQ-SD', 'تكريت': 'IQ-SD', 'سامراء': 'IQ-SD', 'بيجي': 'IQ-SD', 'الدور': 'IQ-SD',
};

/** The governorate a name announces, if any. */
function provinceFromName(name) {
  const n = norm(name);
  let hit = null;
  for (const [city, code] of Object.entries(CITY)) {
    const c = norm(city);
    if (!n.includes(c)) continue;
    // Prefer the longest match: "حمام العليل" over a stray "العليل".
    if (!hit || c.length > hit.city.length) hit = { city: c, code };
  }
  return hit?.code ?? null;
}

/**
 * Which governorate an office belongs to, given its name and its coordinates.
 *
 * The name wins when the two disagree and the point is still inside the named
 * governorate's box. The boxes are deliberately rough and they overlap: Najaf's
 * spans the western desert, which drags its centre far enough south-west that
 * `provinceOf` hands "معمل سمنت الكوفة" and "معمل سمنت النجف الاشرف" to
 * Qadisiyah. The company writing "الكوفة" on its own plant is better evidence
 * than a rectangle. Where the name says nothing, the coordinate decides.
 */
function placeProvince(name, lat, lon) {
  const named = provinceFromName(name);
  if (named && inBox(named, lat, lon)) return named;
  return provinceOf(lat, lon) ?? named;
}

/**
 * Headings, production lines and internal departments that are not places.
 *
 * The positive gate above already removes most of these; this catches the ones
 * that carry a city name for another reason — "معاونية السمنت الشمالية" is a
 * regional management arm, not a plant a citizen visits.
 */
const NOT_A_PLACE = [
  /^(مصانع|معامل|المصانع|المعامل|فروع|الفروع|مصانع الشركه|معامل الشركه|المراكز التسويقيه)$/,
  /تجريب/,
  /^مدرسه (ثانويه|اعداديه|ابتدائيه|متوسطه)$/,
];

/**
 * A sentence about a facility is not a facility.
 *
 * These sites lead with news, and a headline begins exactly like a name does:
 * "معمل سمنت كبيسة يحصل على شهادة ISO9001" starts with a real plant and ends as
 * an article. A verb anywhere in the string is the tell. The directorate pass
 * learned the same lesson the same way, and it must be tested against the
 * *raw* string: `norm()` strips the punctuation that gives a headline away.
 */
const PROSE = /\s(يحصل|يحقق|يعلن|يفتتح|تفتتح|يبحث|يناقش|يستقبل|تستقبل|ينظم|تنظم|يشارك|تشارك|يزور|تزور|يتفقد|يواصل|تواصل|يشكل|تشكل|يوقع|توقع|يستأنف|ينفذ|تنفذ|يجري|تجري|يقدم|تقدم|يبدأ|تبدأ|أنجز|انجز|بحث|ناقش)\s/;

function isPlace(name) {
  if (NOT_A_PLACE.some((re) => re.test(norm(name)))) return false;
  if (name.length > 60) return false;               // a description, not a name
  if (/[:؛]|\.\s|ISO|\d{4}/.test(name)) return false;
  if (PROSE.test(` ${name} `)) return false;
  return true;
}

/**
 * Distinctive words that must come back in a Maps result.
 *
 * All of them, not a sample: taking only the first few let "معمل سمنت حمام
 * العليل الجديد" match the *old* plant next door, and "معمل سمنت كربلاء
 * المقدسة" match a different Karbala plant that Maps places in Anbar.
 */
function mustTokens(name) {
  return tokens(name).filter((w) => !/^(مصنع|معمل|مركز|شعبه|فرع|مقر|شركه|العامه|الشركه)$/.test(w)
    // Honorifics that travel with a city name and are dropped as often as they
    // are written: النجف الأشرف is Najaf, كربلاء المقدسة is Karbala. Requiring
    // them lost the men's clothing factory in Najaf to a perfect match that
    // simply spelled the city the shorter way.
    && !/^(الاشرف|المقدسه|المكرمه)$/.test(w));
}

/**
 * Does this Maps result name the same thing, or merely something similar?
 *
 * Requiring the candidate's words is not enough on its own: "مصنع الرماح"
 * matched a goldsmith's "ورشة الرماح الذهبية", "مصنع بابل" matched a private
 * "شركة اسد بابل للثرمستون", and "مصنع الطارق" — a pharmaceutical plant —
 * matched "شركة الطارق الوطنية للمنتجات الغذائية". Every one of them scored
 * well, because a busy private business has the phone, website and reviews the
 * scorer rewards and a quiet state factory does not.
 *
 * What separates them is what the result *adds*. A match may carry one extra
 * distinctive word — a road, a district, a spelling variant — but a result that
 * introduces two is describing something else.
 */
function namesTheSameThing(placeName, candidateName) {
  const n = norm(placeName);
  const must = mustTokens(candidateName);
  if (!must.length) return false;
  if (!must.every((m) => n.includes(norm(m)))) return false;
  const extra = tokens(placeName).filter((w) => !must.some((m) => norm(m).includes(w) || w.includes(norm(m))));
  // A name with one distinctive word has no room to spare: "مصنع بابل" against
  // "شركة بابل" is one extra word and an entirely different organisation.
  return extra.length <= Math.min(1, must.length - 1);
}

const branches = [];
const dropped = [];
const work = [];

for (const target of CANDIDATES) {
  if (!target.directorate) continue;          // ministry-level crawls have no directorate to hang an office on
  for (const raw of target.candidates) {
    // Menu entries arrive with the separator the template drew them with.
    const c = { ...raw, name: raw.name.replace(/^[\s.،:*•-]+|[\s.،:*•-]+$/g, '').replace(/\s+/g, ' ') };
    if (!isPlace(c.name)) { dropped.push({ ...c, why: 'not a place', target: target.title }); continue; }

    const plotted = c.lat != null && c.lon != null
      ? { lat: c.lat, lon: c.lon }
      : (c.resolved?.lat != null ? { lat: c.resolved.lat, lon: c.resolved.lon } : null);

    if (plotted) {
      const province = placeProvince(c.name, plotted.lat, plotted.lon);
      if (!province) { dropped.push({ ...c, why: 'plotted outside Iraq', target: target.title }); continue; }
      branches.push({
        directorate_slug: target.directorate,
        province_code: province,
        title_ar: c.name,
        gps_lat: plotted.lat,
        gps_lon: plotted.lon,
        website: c.page ?? null,
        _source: 'ministry-site',
        _source_url: c.source,
        _placed: c.via === 'plotted' ? 'plotted-by-the-site' : 'site-map-link',
      });
      continue;
    }

    // Named after a place, or labelled by a resolved Maps link: worth verifying.
    // A name with no governorate in it still gets a try, but on a tighter rein —
    // there is no governorate to check the answer against, so the name itself
    // has to carry the match. Dropping these outright would lose real factories
    // whose only sin is that their page never says which city they are in.
    const label = c.resolved?.label || null;
    const province = provinceFromName(label || c.name);
    work.push({ candidate: c, target, province, query: label || c.name, strict: !province });
  }
}

console.log(`${branches.length} placed by the sites themselves; ${work.length} to verify against Maps; `
  + `${dropped.length} dropped.`);

if (!DRY && work.length) {
  const found = await pool(work, 4, async (item) => {
    const must = mustTokens(item.query);
    // Without a governorate to check against, ask with the company's name as
    // context and demand every distinctive word back, so "مصنع الطارق" cannot
    // quietly match a shop of the same name in another city.
    const query = item.strict ? `${item.query} ${item.target.title} العراق` : `${item.query} العراق`;
    const results = await search(query);
    let best = null;
    for (const place of results) {
      if (place.lat == null) continue;
      // The name said which governorate this is in; Maps has to agree. With no
      // governorate stated, the country is the only geographic check there is.
      if (item.province ? !inBox(item.province, place.lat, place.lon) : !provinceOf(place.lat, place.lon)) continue;
      const score = scorePlace(place, { must });
      if (score < 0) continue;
      if (!namesTheSameThing(place.name, item.query)) continue;
      if (!best || score > best.score) best = { place, score };
    }
    return best ? { ...item, ...best } : null;
  });

  for (const hit of found) {
    if (!hit) continue;
    const { place, candidate, target } = hit;
    const province = hit.province ?? provinceOf(place.lat, place.lon);
    branches.push({
      directorate_slug: target.directorate,
      province_code: province,
      title_ar: candidate.name,
      address_ar: place.address ?? null,
      gps_lat: place.lat,
      gps_lon: place.lon,
      phone: place.phone ?? null,
      website: candidate.page ?? null,
      photo_url: largePhoto(place.photo),
      place_id: place.ftid ?? null,
      maps_url: place.maps_url ?? null,
      _source: 'ministry-site',
      _source_url: candidate.source,
      _placed: hit.strict
        ? 'named-by-the-site, located on Maps (no governorate stated)'
        : 'named-by-the-site, located on Maps',
      _confidence: hit.score,
    });
  }
  const verified = found.filter(Boolean).length;
  console.log(`${verified} of ${work.length} verified on Maps (${work.length - verified} could not be confirmed and were dropped).`);
}

/**
 * A plotted office whose name mentions no city takes the governorate of a
 * neighbour that does.
 *
 * "معاونية السمنت الجنوبية" sits 90 metres from "معمل سمنت الكوفة" on the same
 * site, so the box heuristic's answer for it — Qadisiyah — is wrong for the
 * same reason it was wrong for the plant. Two buildings that close are in the
 * same governorate, and one of them has the governorate written on it.
 */
const KM = 111.32;
for (const office of branches) {
  if (provinceFromName(office.title_ar)) continue;
  let nearest = null;
  for (const other of branches) {
    if (other === office || !provinceFromName(other.title_ar)) continue;
    const dy = (other.gps_lat - office.gps_lat) * KM;
    const dx = (other.gps_lon - office.gps_lon) * KM * Math.cos((office.gps_lat * Math.PI) / 180);
    const km = Math.hypot(dx, dy);
    if (km <= 10 && (!nearest || km < nearest.km)) nearest = { km, code: other.province_code };
  }
  if (nearest && nearest.code !== office.province_code) {
    console.log(`  ${office.title_ar}: ${office.province_code} -> ${nearest.code}`
      + ` (${nearest.km.toFixed(1)} km from a neighbour that names its governorate)`);
    office.province_code = nearest.code;
  }
}

/**
 * One record per building.
 *
 * A plant usually arrives twice — once plotted by its company, once found on
 * Maps — and the two have to be merged by name, not by place id, because the
 * plotted copy has no place id to merge on. The company's own coordinates win;
 * everything Maps adds (address, phone, photograph) is kept.
 */
const unique = new Map();
for (const b of branches) {
  const key = `${b.directorate_slug}::${norm(b.title_ar)}`;
  const prev = unique.get(key);
  if (!prev) { unique.set(key, b); continue; }
  const plotted = prev._placed === 'plotted-by-the-site' ? prev : (b._placed === 'plotted-by-the-site' ? b : null);
  const merged = { ...prev, ...b };
  if (plotted) {
    merged.gps_lat = plotted.gps_lat;
    merged.gps_lon = plotted.gps_lon;
    merged.province_code = plotted.province_code;
    merged._placed = 'plotted-by-the-site, confirmed on Maps';
  }
  unique.set(key, merged);
}

/**
 * And one record per building when the site writes its name two ways.
 *
 * "معمل سمنت كربلاء" and "معمل سمنت كربلاء المقدسة" are the same plant at the
 * same coordinates. Collapsing merely-nearby offices would be wrong — this
 * company deliberately plots الرافدين, بادوش الجديد and بادوش التوسيع at one
 * point, and they are three plants — so the test is that one name *begins* with
 * the other, which a longer honorific satisfies and a different plant does not.
 */
const near = (a, b) => {
  const dy = (a.gps_lat - b.gps_lat) * 111.32;
  const dx = (a.gps_lon - b.gps_lon) * 111.32 * Math.cos((a.gps_lat * Math.PI) / 180);
  return Math.hypot(dx, dy) <= 0.3;
};
for (const [keyA, a] of [...unique]) {
  for (const [keyB, b] of [...unique]) {
    if (keyA === keyB || !unique.has(keyA) || !unique.has(keyB)) continue;
    if (a.directorate_slug !== b.directorate_slug || !near(a, b)) continue;
    const [nA, nB] = [norm(a.title_ar), norm(b.title_ar)];
    if (!nB.startsWith(`${nA} `)) continue;
    unique.set(keyB, { ...a, ...b, gps_lat: a.gps_lat, gps_lon: a.gps_lon, province_code: a.province_code });
    unique.delete(keyA);
  }
}
const out = [...unique.values()].sort((a, b) =>
  a.directorate_slug.localeCompare(b.directorate_slug) || a.province_code.localeCompare(b.province_code));

fs.writeFileSync('ministry-site-branches.json', JSON.stringify(out, null, 1));

const byProvince = {};
for (const b of out) byProvince[b.province_code] = (byProvince[b.province_code] || 0) + 1;
console.log(`\n${out.length} offices across ${Object.keys(byProvince).length} governorates:`);
console.log('  ' + Object.entries(byProvince).sort((a, b) => b[1] - a[1]).map(([p, n]) => `${p}:${n}`).join('  '));
fs.writeFileSync('ministry-site-dropped.json', JSON.stringify(dropped, null, 1));

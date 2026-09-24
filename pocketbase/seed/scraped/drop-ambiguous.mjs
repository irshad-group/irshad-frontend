// Sixth pass: withdraw locations that a name could never have earned.
//
// Some bodies are named only by their internal function — "Directorate of Legal",
// "دائرة الشؤون الادارية", "General Directorate of the Diwan". Every ministry has one,
// so the name identifies a record only *within its parent*. A global place search on
// such a name cannot be right except by luck, and in practice it wasn't: "Directorate
// of Legal" matched a law firm, "Directorate of Administration" matched a public
// administration institute.
//
// The name and the ministry link are real and stay. Everything a place lookup
// contributed — coordinates, phone, photo, address, and any name taken from the
// matched place — is removed.
import fs from 'node:fs';
import path from 'node:path';
import { norm, tokens } from './match.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const IN = process.argv[2] || path.join(HERE, 'iraq-government-directory.json');
const ds = JSON.parse(fs.readFileSync(IN, 'utf8'));

// Words naming an internal function rather than a distinct public-facing body.
//
// Arabic entries are *stems*, tested with `includes` rather than equality. The same
// function shows up as "الدائرة القانونية" and "مديرية القانوني" — feminine and
// masculine — and behind a proclitic as "للخدمات". Exact forms matched the first
// spelling of each and quietly missed the rest, which is how a private law firm's
// homepage survived on a ministry's legal department.
const EN_FUNCTION_WORDS = new Set([
  'legal', 'administration', 'administrative', 'finance', 'financial', 'accounting',
  'auditing', 'audit', 'media', 'information', 'planning', 'follow', 'followup',
  'services', 'service', 'research', 'training', 'diwan',
  'human', 'resources', 'affairs', 'technical', 'statistics', 'coordination',
  'relations', 'monitoring', 'evaluation', 'inspection', 'archive', 'documentation',
  'office', 'bureau', 'director', 'minister', 'deputy', 'secretariat', 'department',
]);

const AR_FUNCTION_STEMS = [
  'قانون', 'ادار', 'محاسب', 'حساب', 'تدقيق', 'رقاب', 'اعلام', 'تخطيط', 'متابع',
  'خدمات', 'بحوث', 'تدريب', 'ديوان', 'بشري', 'فني', 'احصاء', 'تنسيق', 'تقييم',
  'تفتيش', 'ارشيف', 'توثيق', 'اقسام', 'مكتب', 'سكرتاري', 'امانه', 'وزير', 'وكيل',
  'مدير', 'ذاتي',
].map((w) => norm(w));

const isFunctionWord = (w) => EN_FUNCTION_WORDS.has(w) || AR_FUNCTION_STEMS.some((st) => w.includes(st));

// Everything a place lookup can contribute. Not just the coordinates: the matched
// place also supplied the English/Kurdish name and, where the ministry's own site
// had no link, the website — so "Directorate of Legal" ended up carrying a private
// law firm's homepage. Withdrawing the pin while keeping that is worse than useless.
const FROM_PLACE = ['gps_lat', 'gps_lon', 'phone', 'address_ar', 'photo_url',
  'place_id', 'maps_url', 'working_hours', 'email'];

// title_en / title_ku and website are only place-derived *sometimes* — the ministry's
// own English page is an equally common source, and that name is correct. Clear them
// only when the provenance says they came off the match.
const PROVENANCED = [
  ['title_en', '_title_en_source'],
  ['title_ku', '_title_ku_source'],
  ['website', '_website_source'],
];

// A governorate or city in the name is exactly what makes a body findable, but the
// tokenizer strips place names as stop words — so "مديرية احصاء اربيل" would reduce
// to "احصاء" and read as generic. Check the raw title before tokenising.
const PLACE_NAMES = new RegExp([
  'بغداد', 'البصرة', 'نينوى', 'الموصل', 'اربيل', 'أربيل', 'هەولێر', 'السليمانية',
  'سلێمانی', 'دهوك', 'دهوک', 'دهۆک', 'حلبجة', 'هەڵەبجە', 'كركوك', 'الانبار', 'الأنبار',
  'بابل', 'كربلاء', 'النجف', 'ديالى', 'ذي قار', 'ميسان', 'المثنى', 'الديوانية',
  'القادسية', 'واسط', 'صلاح الدين', 'تكريت', 'كرميان', 'گرمیان', 'گەرمیان',
  'الرصافة', 'الكرخ',
  'baghdad', 'basra', 'nineveh', 'mosul', 'erbil', 'hawler', 'sulaymaniyah', 'duhok',
  'dohuk', 'halabja', 'kirkuk', 'anbar', 'babil', 'karbala', 'najaf', 'diyala',
  'maysan', 'muthanna', 'qadisiyyah', 'wasit', 'tikrit', 'garmian', 'rusafa', 'karkh',
].join('|'), 'i');

/** True when nothing in the name distinguishes this body from its peers elsewhere. */
function isGeneric(title) {
  if (PLACE_NAMES.test(title || '')) return false;
  const t = tokens(title);
  if (!t.length) return true;
  return t.every(isFunctionWord);
}

let cleared = 0;
const report = [];
for (const d of ds.directorates) {
  if (!isGeneric(d.title_ar)) continue;
  const provenanced = PROVENANCED.filter(([f, src]) => d[f] != null && d[src] === 'place-match');
  const plain = FROM_PLACE.filter((f) => d[f] != null);
  if (!plain.length && !provenanced.length) continue;

  report.push(`  ${d.ministry_slug.slice(0, 34).padEnd(34)} ${String(d.title_ar).slice(0, 38).padEnd(38)}`
    + ` was: ${String(d._maps_name || d._located_by?.matched_name || '?').slice(0, 40)}`);
  if (plain.length) report.push(`      cleared: ${plain.join(', ')}`);
  for (const f of FROM_PLACE) d[f] = null;
  for (const [f, src] of provenanced) {
    report.push(`      cleared ${f} (came from the match): ${String(d[f]).slice(0, 60)}`);
    d[f] = null;
    d[src] = null;
  }
  // If the ministry published this body's name in English (gov.krd's English
  // microsites), that name lives in title_ar for want of an Arabic one. Put it back
  // into title_en now that the match-derived value is gone.
  if (!d.title_en && d.title_ar && !/[؀-ۿ]/.test(d.title_ar)) {
    d.title_en = d.title_ar;
    d._title_en_source = 'ministry-site';
  }
  d._verified = false;
  d._ambiguous_name = 'name states an internal function only; no place lookup can identify it';
  delete d._osm;
  delete d._located_by;
  cleared += 1;
}

console.log(`directorates whose name is an internal function only: ${ds.directorates.filter((d) => isGeneric(d.title_ar)).length}`);
console.log(`of those, had a place match that has now been withdrawn: ${cleared}`);
if (report.length) console.log(report.join('\n'));

fs.writeFileSync(IN, JSON.stringify(ds, null, 2));

const D = ds.directorates;
console.log(`\ndirectorates located: ${D.filter((d) => d.gps_lat).length}/${D.length}`);

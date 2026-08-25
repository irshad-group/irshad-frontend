// Seventh pass: recover Arabic and Kurdish names for the KRG directorates that were
// harvested from gov.krd's *English* microsites.
//
// Each KRG ministry's contact page carries an "Organisation" list of its bodies, and
// gov.krd publishes that same page in Arabic and Kurdish. The lists usually line up
// index for index — but not always: on the Endowments ministry the Kurdish list puts
// Garmian at position 6 where English has Hajj and Umrah. Aligning blindly by position
// would therefore have labelled the Hajj directorate "Garmian", silently and
// plausibly.
//
// So position is only ever a *proposal* here. It is accepted for a ministry only when
// the items carrying a recognisable anchor — a governorate name, or a distinctive
// topic like Hajj / Yazidi / Martyrs — agree at every position. If any anchored pair
// disagrees, that language is rejected wholesale for that ministry and those names are
// left empty rather than guessed.
import fs from 'node:fs';
import path from 'node:path';
import { get, txt } from './fetch.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const IN = process.argv[2] || path.join(HERE, 'iraq-government-directory.json');
const ds = JSON.parse(fs.readFileSync(IN, 'utf8'));

// gov.krd short code per ministry slug.
const CODES = {
  'krg-ministry-of-interior': 'moi',
  'krg-ministry-of-labour-and-social-affairs': 'molsa',
  'krg-ministry-of-martyrs-and-anfal-affairs': 'moma',
  'krg-ministry-of-endowment-and-religious-affairs': 'moera',
  'krg-ministry-of-justice': 'moj',
  'krg-ministry-of-health': 'moh',
  'krg-ministry-of-education': 'moe',
  'krg-ministry-of-planning': 'mop',
  'krg-ministry-of-finance-and-economy': 'mofe',
  'krg-ministry-of-municipalities-and-tourism': 'momt',
  'krg-ministry-of-trade-and-industry': 'moti',
  'krg-ministry-of-transport-and-communications': 'motac',
  'krg-ministry-of-electricity': 'moel',
  'krg-ministry-of-construction-and-housing': 'moch',
  'krg-ministry-of-agriculture-and-water-resources': 'moawr',
  'krg-ministry-of-culture-and-youth': 'mocy',
  'krg-ministry-of-higher-education': 'mohe',
  'krg-ministry-of-natural-resources': 'mnr',
  'krg-ministry-of-peshmerga-affairs': 'mopa',
};

// Language-neutral anchors. Each entry lists the surface forms in en / ar / ku that
// mean the same thing; two items sharing an anchor are talking about the same body.
//
// The Arabic forms are *stems*, deliberately without the definite article: the same
// word appears as "الأوقاف" in one entry and "للأوقاف" in the next, and a pattern
// carrying the article matches only the first. Text is normalised (tashkeel stripped,
// أإآ→ا, ة→ه) before testing so أوقاف and اوقاف compare equal. Kurdish is left
// unfolded — its ی must not be collapsed into ي.
// gov.krd's Arabic pages are typed on Kurdish keyboards, so Persian yeh (ی) and
// keheh (ک) turn up inside Arabic words — "الوزیر", "وکیل". Fold them to the Arabic
// letters, or every pattern written in Arabic silently misses those entries.
const anorm = (s) => (s || '')
  .replace(/[ً-ْٰـ]/g, '')
  .replace(/[أإآٱ]/g, 'ا')
  .replace(/ة/g, 'ه')
  .replace(/[یى]/g, 'ي')
  .replace(/[کڪ]/g, 'ك');

const ANCHORS = {
  erbil: [/erbil|hawler/i, /اربيل|هەولێر/, /هەولێر/],
  sulaymaniyah: [/sulaymaniyah|sulaimani|slemani/i, /سليمانيه/, /سلێمانی/],
  duhok: [/dohuk|duhok/i, /دهوك|دهوک/, /دهۆک/],
  halabja: [/halabja/i, /حلبجه/, /هەڵەبجە/],
  garmian: [/garmian/i, /كرميان|گرميان|كرمیان|گرمیان/, /گەرمیان/],
  hajj: [/hajj|umrah/i, /حج و|حج$|عمره/, /حەج|عەمرە/],
  christian: [/christian/i, /مسيحي/, /مەسیحی/],
  yazidi: [/yazidi|ezidi/i, /ايزيدي|یزيدي/, /ئێزیدی/],
  martyrs: [/martyr|anfal/i, /شهداء|مونفل|مؤنفل/, /شەهیدان|ئەنفال/],
  endowment: [/endowment/i, /اوقاف/, /ئەوقاف/],
  diwan: [/diwan/i, /ديوان/, /دیوان/],
  interior: [/interior|internal/i, /داخلي/, /ناوخۆ/],
  local: [/local/i, /محلي/, /خۆجێ/],
  quality: [/quality|control/i, /نوعي/, /جۆری|نۆعی/],
  research: [/research|training/i, /بحوث|تدريب/, /توێژینەوە|ڕاهێنان|راهێنان/],
  legal: [/legal/i, /قانوني/, /یاسایی/],
  audit: [/audit/i, /تدقيق/, /وردبینی|پشکنین/],
  accounting: [/accounting|accounts/i, /حسابات|محاسبه/, /ژمێریاری/],
  planning: [/planning|follow/i, /تخطيط|متابعه/, /پلاندانان/],
  media: [/media/i, /اعلام/, /ڕاگەیاندن|راگەیاندن/],
  services: [/services/i, /خدمات/, /خزمەتگوزاری/],
  investment: [/investment/i, /استثمار/, /وەبەرهێنان/],
  inspector: [/inspector/i, /مفتش/, /پشکنەری/],
  security: [/security forces/i, /امن الداخلي|قوى الامن/, /ئاسایش/],
  minister: [/^\s*(the\s+)?minister\s*$/i, /^\s*الوزير\s*$/, /^\s*وەزیر\s*$/],
  deputy: [/deputy|undersecretary/i, /وكيل|وکيل/, /بریکار|وەکیل/],
};
const LANG_IDX = { en: 0, ar: 1, ku: 2 };

const anchorsOf = (text, lang) => {
  const i = LANG_IDX[lang];
  const probe = lang === 'ar' ? anorm(text) : text;
  const out = new Set();
  for (const [name, pats] of Object.entries(ANCHORS)) if (pats[i].test(probe)) out.add(name);
  return out;
};
const sameSet = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));

/**
 * The "Organisation" list. Identified by its own first entry rather than by the
 * surrounding markup: every one of these lists opens with the minister, and the
 * page's other <ul>s are site navigation. The English page puts a </div> between
 * the heading and the list while the Arabic one does not, so keying off the heading
 * is not portable across the three languages.
 */
function orgList(html, lang) {
  const isMinister = ANCHORS.minister[LANG_IDX[lang]];
  let best = [];
  for (const ul of html.matchAll(/<ul>([\s\S]*?)<\/ul>/gi)) {
    const items = [...ul[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
      .map((x) => txt(x[1])).filter(Boolean);
    const first = lang === 'ar' ? anorm(items[0]) : items[0];
    if (items.length < 3 || !isMinister.test(first)) continue;
    if (items.length > best.length) best = items;
  }
  return best;
}

const fetchList = (code, lang) => {
  const prefix = { en: 'english/', ar: 'arabic/', ku: '' }[lang];
  const r = get(`https://gov.krd/${prefix}government/entities/${code}/contact/`);
  return r.html ? orgList(r.html, lang) : [];
};

/**
 * Decide whether `other` can be aligned to `en` by position.
 * Proof obligation: same length, and every position where either side carries an
 * anchor must carry the *same* anchors on both sides.
 */
function alignmentHolds(en, other, lang) {
  if (en.length !== other.length || en.length < 3) return { ok: false, reason: 'list lengths differ' };
  let checked = 0;
  for (let i = 0; i < en.length; i++) {
    const a = anchorsOf(en[i], 'en');
    const b = anchorsOf(other[i], lang);
    if (!a.size && !b.size) continue;
    checked += 1;
    if (!sameSet(a, b)) {
      return { ok: false, reason: `position ${i} disagrees: "${en[i]}" vs "${other[i]}"` };
    }
  }
  if (checked < 2) return { ok: false, reason: 'too few anchored items to prove the alignment' };
  return { ok: true, checked };
}

const norm = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
const stats = { ar: 0, ku: 0 };

for (const [slug, code] of Object.entries(CODES)) {
  const targets = ds.directorates.filter((d) => d.ministry_slug === slug && d._title_ar_needs_translation);
  if (!targets.length) continue;

  const en = fetchList(code, 'en');
  if (!en.length) { console.log(`${code.padEnd(6)} no English organisation list — skipped`); continue; }
  // Freeze the English name now: the Arabic pass replaces title_ar, and the Kurdish
  // pass still needs the English string to find its row.
  for (const d of targets) if (!d._en_key) d._en_key = d.title_ar;

  // The ministry's own English list is the authoritative English name for these
  // rows, and it beats whatever a place match produced. Those matches were poor
  // here by construction — these are exactly the records no place lookup could
  // place — and had left the Endowments directorate in Erbil labelled "Erbil
  // General Directorate of Health" and the one in Duhok "Dohuk Electricity".
  for (const d of targets) {
    if (d.title_en !== d._en_key) {
      if (d.title_en) console.log(`${code.padEnd(6)} en: replaced "${String(d.title_en).slice(0, 46)}" with the ministry's own name`);
      d.title_en = d._en_key;
      d._title_en_source = 'gov.krd English organisation list';
    }
    // Any Kurdish name still present came off one of those same bad matches. The
    // Kurdish pass below re-fills it when gov.krd's Kurdish list can be trusted.
    if (d._title_ku_source === 'place-match') { d.title_ku = null; d._title_ku_source = null; }
  }

  for (const lang of ['ar', 'ku']) {
    const other = fetchList(code, lang);
    if (!other.length) { console.log(`${code.padEnd(6)} ${lang}: no list published`); continue; }
    const check = alignmentHolds(en, other, lang);
    if (!check.ok) { console.log(`${code.padEnd(6)} ${lang}: REJECTED — ${check.reason}`); continue; }

    const byEn = new Map(en.map((t, i) => [norm(t), other[i]]));
    let n = 0;
    for (const d of targets) {
      const hit = byEn.get(norm(d._en_key));
      if (!hit) continue;
      if (lang === 'ar') {
        d.title_ar = hit;
        d._title_ar_source = 'gov.krd Arabic organisation list (position-aligned, anchor-verified)';
        delete d._title_ar_needs_translation;
      } else if (!d.title_ku) {
        d.title_ku = hit;
        d._title_ku_source = 'gov.krd Kurdish organisation list (position-aligned, anchor-verified)';
      }
      n += 1;
      stats[lang] += 1;
    }
    console.log(`${code.padEnd(6)} ${lang}: accepted (${check.checked} anchored positions agree) — filled ${n}`);
  }
}

for (const d of ds.directorates) delete d._en_key;
fs.writeFileSync(IN, JSON.stringify(ds, null, 2));

const left = [...ds.ministries, ...ds.directorates, ...ds.branches].filter((r) => r._title_ar_needs_translation);
console.log(`\nArabic names recovered : ${stats.ar}`);
console.log(`Kurdish names recovered: ${stats.ku}`);
console.log(`still needing a translation: ${left.length}`);
for (const r of left) console.log(`   ${String(r.ministry_slug ?? "(branch)").padEnd(46)} ${r.title_ar}`);

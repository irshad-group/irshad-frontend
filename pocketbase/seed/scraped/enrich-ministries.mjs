import fs from 'node:fs';
import path from 'node:path';
import { search } from './gmaps.mjs';
import { scorePlace, tokens, norm } from './match.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const seed = JSON.parse(fs.readFileSync(path.join(HERE, 'seed-ministries.json'), 'utf8'));

// Distinctive token that must show up in a Maps result for it to be this ministry.
const MUST = {
  'ministry-of-interior': ['الداخلية'],
  'ministry-of-defence': ['الدفاع'],
  'ministry-of-foreign-affairs': ['الخارجية'],
  'ministry-of-justice': ['العدل'],
  'ministry-of-finance': ['المالية'],
  'ministry-of-education': ['التربية'],
  'ministry-of-higher-education': ['التعليم العالي', 'التعليم'],
  'ministry-of-oil': ['النفط'],
  'ministry-of-labour-and-social-affairs': ['العمل'],
  'ministry-of-electricity': ['الكهرباء'],
  'ministry-of-migration-and-displaced': ['الهجرة'],
  'ministry-of-water-resources': ['الموارد المائية', 'الموارد'],
  'ministry-of-construction-housing-municipalities-and-public-works': ['الاعمار', 'الإعمار'],
  'ministry-of-communications': ['الاتصالات'],
  'ministry-of-youth-and-sports': ['الشباب'],
  'ministry-of-culture-tourism-and-antiquities': ['الثقافة'],
  'ministry-of-trade': ['التجارة'],
  'ministry-of-health': ['الصحة'],
  'ministry-of-transport': ['النقل'],
  'ministry-of-planning': ['التخطيط'],
  'ministry-of-agriculture': ['الزراعة'],
  'ministry-of-industry-and-minerals': ['الصناعة'],
  'ministry-of-environment': ['البيئة'],
  'krg-ministry-of-justice': ['العدل', 'داد'],
  'krg-ministry-of-peshmerga-affairs': ['البيشمركة', 'بيشمركة', 'پێشمەرگە', 'peshmerga'],
  'krg-ministry-of-interior': ['الداخلية', 'ناوخۆ'],
  'krg-ministry-of-finance-and-economy': ['المالية', 'دارایی'],
  'krg-ministry-of-natural-resources': ['الثروات', 'الموارد الطبيعية', 'سامانە'],
  'krg-ministry-of-health': ['الصحة', 'تەندروستی'],
  'krg-ministry-of-education': ['التربية', 'پەروەردە'],
  'krg-ministry-of-construction-and-housing': ['الاعمار', 'الإعمار', 'ئاوەدانکردنەوە'],
  'krg-ministry-of-municipalities-and-tourism': ['البلديات', 'شارەوانی'],
  'krg-ministry-of-higher-education': ['التعليم العالي', 'التعليم', 'خوێندنی باڵا'],
  'krg-ministry-of-planning': ['التخطيط', 'پلاندانان'],
  'krg-ministry-of-labour-and-social-affairs': ['العمل', 'کار و'],
  'krg-ministry-of-culture-and-youth': ['الثقافة', 'ڕۆشنبیری', 'رۆشنبیری'],
  'krg-ministry-of-martyrs-and-anfal-affairs': ['الشهداء', 'شەهیدان', 'المؤنفلين'],
  'krg-ministry-of-agriculture-and-water-resources': ['الزراعة', 'کشتوکاڵ'],
  'krg-ministry-of-trade-and-industry': ['التجارة', 'بازرگانی'],
  'krg-ministry-of-transport-and-communications': ['النقل', 'الاتصالات', 'گواستنەوە'],
  'krg-ministry-of-endowment-and-religious-affairs': ['الاوقاف', 'الأوقاف', 'ئەوقاف'],
  'krg-ministry-of-electricity': ['الكهرباء', 'کارەبا'],
};

// Maps sometimes answers a ministry query with one of its directorates. These
// slugs pick the right entry out of the candidate pool by name; `null` means the
// HQ is not reliably mapped and we would rather store no location than a wrong one.
const PREFER = {
  'krg-ministry-of-finance-and-economy': 'وزارة المالیة في اقلیم کردستان',
  'krg-ministry-of-endowment-and-religious-affairs': null,
};

const EXTRA_Q = {
  'krg-ministry-of-transport-and-communications': [
    'وەزارەتی گواستنەوە و گەیاندن هەولێر',
    'Ministry of Transport and Communications Kurdistan Erbil',
    'وزارة النقل والمواصلات اقليم كردستان',
  ],
};

function queries(m) {
  const bare = m.title_ar.split('—')[0].trim();
  const qs = [m.q];
  if (m.krg) {
    qs.push(`${bare} حكومة اقليم كردستان`, `${m.title_ku} هەولێر`, `${m.title_en} Erbil Kurdistan`);
  } else {
    qs.push(`${bare} العراق`, `${m.title_en} Iraq Baghdad`);
  }
  qs.push(...(EXTRA_Q[m.slug] || []));
  return [...new Set(qs)];
}

const out = [];
for (const m of seed) {
  const must = MUST[m.slug] || tokens(m.title_ar);
  const pool = new Map();
  for (const q of queries(m)) {
    const lang = /[A-Za-z]{4}/.test(q.replace(/[^\x00-\x7F]/g, '')) ? 'en' : 'ar';
    for (const p of await search(q, { lang })) {
      const k = p.ftid || `${p.name}@${p.lat}`;
      if (!pool.has(k)) pool.set(k, p);
    }
  }
  const ranked = [...pool.values()]
    .map((p) => ({ p, s: scorePlace(p, { must, krg: m.krg, expectMinistry: true }) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s);
  let top = ranked[0]?.p ?? null;
  if (Object.prototype.hasOwnProperty.call(PREFER, m.slug)) {
    const want = PREFER[m.slug];
    top = want ? (ranked.find((r) => norm(r.p.name).includes(norm(want)))?.p ?? null) : null;
  }

  const rec = {
    slug: m.slug, krg: m.krg,
    title_ar: m.title_ar, title_en: m.title_en, title_ku: m.title_ku,
    website: m.website || top?.website || null,
    gps_lat: top?.lat ?? null, gps_lon: top?.lon ?? null,
    phone: top?.phone ?? null,
    address_ar: top?.address ?? null,
    photo: top?.photo ?? null,
    maps_name: top?.name ?? null,
    maps_url: top?.maps_url ?? null,
    maps_rating: top?.rating ?? null,
    maps_categories: top?.categories ?? [],
    pool_size: pool.size,
    candidates: ranked.slice(0, 4).map((r) => `${r.s}|${r.p.name}|${r.p.lat},${r.p.lon}`),
  };
  out.push(rec);
  console.log(`${rec.slug.padEnd(58)} gps=${rec.gps_lat ? 'Y' : '-'} ph=${rec.phone ? 'Y' : '-'} ph0=${rec.photo ? 'Y' : '-'} n=${pool.size} :: ${rec.maps_name || 'NO MATCH'}`);
}
fs.writeFileSync(path.join(HERE, 'ministries-enriched.json'), JSON.stringify(out, null, 2));
console.log(`\nmatched ${out.filter((r) => r.gps_lat).length}/${out.length}  phone ${out.filter((r) => r.phone).length}  photo ${out.filter((r) => r.photo).length}`);

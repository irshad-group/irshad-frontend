// Turn the raw link harvest into a de-duplicated list of real bodies.
import fs from 'node:fs';
import path from 'node:path';
import { norm, stripTashkeel } from './match.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const disc = JSON.parse(fs.readFileSync(path.join(HERE, 'directorates-discovered.json'), 'utf8'));

// A news headline mentions a body but is not one. Drop anything that reads like prose.
// A headline mentions a body but is not one. The verb list is the tell: a directorate
// name is a noun phrase, so any finite verb means this is news copy scraped off the
// ministry's front page. Missing a few let "مديرية الاستخبارات العسكرية تطيح بأربعة من
// تجار المخدرات" into the directory as though it were an office.
const PROSE = new RegExp([
  'يلتقي', 'يزور', 'يترأس', 'يبحث', 'يستقبل', 'تستقبل', 'أعلن', 'اعلن', 'تعلن', 'يعلن',
  'تجهز', 'يجهز', 'تشغل', 'يشغل', 'تنجز', 'ينجز', 'توزع', 'يوزع', 'يتفقد', 'تتفقد',
  'يشارك', 'تشارك', 'تطيح', 'يطيح', 'تناقش', 'يناقش', 'تبحث', 'ترعى', 'يرعى',
  'تنفذ', 'ينفذ', 'تباشر', 'يباشر', 'تواصل', 'يواصل', 'تحتفل', 'يحتفل', 'تقيم', 'يقيم',
  'بمناسبة', 'خلال', 'ضمن', 'بحضور', 'نتائج', 'تهنئة', 'بيان', 'زيارة', 'اجتماع',
  'افتتاح', 'توقيع', 'ورشة', 'ندوة', 'مؤتمر', 'احتفال', 'إصدارات', 'اصدارات',
  'نشاطات', 'أخبار', 'اخبار',
].join('|') + '|\\.\\.\\.|…|\\?|؟|!');
const TOO_LONG = 90;
const HEADING = /^(دوائر الوزارة|الدوائر|المديريات|الهيئات|الشركات|departments?|directorates?)$/i;

// gov.krd cross-government nav that shows up on every KRG ministry microsite.
const KRG_SHARED = new Set([
  'department of foreign relations', 'department of media and information',
  'department of coordination and follow-up', 'department of information technology',
  'department of non-governmental organization', 'mine action agency',
].map(norm));

const rows = [];
const perMinistry = {};
for (const m of disc) {
  const keep = [];
  const seen = new Set();
  for (const b of m.bodies || []) {
    // Ministry sites append their "details" link text to the body's name, so the same
    // directorate arrives twice — once bare, once suffixed. Strip it before the dedupe
    // below, or both survive as separate offices.
    const name = b.name.replace(/\s+/g, ' ').trim().replace(/\s*(التفاصيل|المزيد|اقرأ المزيد)$/, '').trim();
    if (name.length > TOO_LONG || name.length < 8) continue;
    // Test the verb list against undiacritised text: these pages write "توزّع" and
    // "تشغّل" with a shadda, and a bare "توزع" in the pattern misses both.
    if (PROSE.test(stripTashkeel(name))) continue;
    if (HEADING.test(name)) continue;
    const k = norm(name);
    if (!k || seen.has(k)) continue;
    if (KRG_SHARED.has(k)) continue;
    seen.add(k);
    keep.push({ name, url: b.url });
  }
  perMinistry[m.slug] = keep;
  for (const k of keep) rows.push({ ministry_slug: m.slug, krg: m.krg, ...k });
  console.log(`${m.slug.padEnd(58)} ${String((m.bodies || []).length).padStart(3)} -> ${String(keep.length).padStart(3)}`);
}
fs.writeFileSync(path.join(HERE, 'directorates-clean.json'), JSON.stringify(rows, null, 2));
console.log(`\nTOTAL kept: ${rows.length}`);
console.log(`ministries with >0: ${Object.values(perMinistry).filter((v) => v.length).length}`);

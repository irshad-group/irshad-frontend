// Turn the raw link harvest into a de-duplicated list of real bodies.
import fs from 'node:fs';
import path from 'node:path';
import { norm } from './match.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const disc = JSON.parse(fs.readFileSync(path.join(HERE, 'directorates-discovered.json'), 'utf8'));

// A news headline mentions a body but is not one. Drop anything that reads like prose.
const PROSE = /(يلتقي|يزور|يترأس|يبحث|يستقبل|أعلن|اعلن|تعلن|يعلن|بمناسبة|خلال|ضمن|بحضور|نتائج|تهنئة|بيان|زيارة|اجتماع|افتتاح|توقيع|ورشة|ندوة|مؤتمر|احتفال|\.\.\.|…|\?|؟|!)/;
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
    const name = b.name.replace(/\s+/g, ' ').trim();
    if (name.length > TOO_LONG || name.length < 8) continue;
    if (PROSE.test(name)) continue;
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

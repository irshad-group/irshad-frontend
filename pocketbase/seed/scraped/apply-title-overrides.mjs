/**
 * Last step of the refine chain: reviewed English titles, and rows that are not
 * institutions.
 *
 * `enrich-names.mjs` takes `title_en` from a Google Maps place match, and a
 * place match returns the English label of whichever place matched — not a
 * translation of this office. Eighty of those named a different institution
 * (the Public Prosecution Directorate as "Supreme Judicial Council of Iraq",
 * Halabja's education directorate as "General Directorate of Arbil Education").
 * Another 202 directorates got no English at all, and `import-geography.mjs`
 * then falls back to the Arabic, so the English site showed Arabic names under
 * an English heading.
 *
 * Those were corrected in PocketBase by `../fix-directorate-titles.mjs`. This
 * step makes the correction part of the dataset, because the importer upserts
 * `title_en` on every run: without it, the next import would put every wrong
 * name back and re-create the rows below that were deleted.
 *
 * Reads the same two files the PocketBase repair reads, so the two cannot
 * disagree:
 *
 * - `directorate-titles-en.json` — Arabic name -> English, for records the scrape
 *   left without English. Applied only where `title_en` is empty or Arabic, so
 *   an English name a later source provides is never overwritten.
 * - `directorate-titles-audit.json` — `replace` corrects place-matched names that
 *   point at another body; `not_institutions` lists, by slug, the sixteen rows
 *   the crawl turned into records from nav crumbs, a job title, a handbook and a
 *   news headline. They are listed by slug rather than inferred from "has no
 *   translation", because offices added since then may also lack English and
 *   must not be dropped for it.
 *
 * The translations are reviewed but they are not the bodies' registered
 * English names; `_title_en_source` records that, as the dataset does for every
 * other source.
 *
 * Idempotent: a second run changes nothing. Rewrites iraq-government-directory.json
 * in place.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(HERE, 'iraq-government-directory.json');
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

const TRANSLATIONS = read(path.join(HERE, '..', 'directorate-titles-en.json'));
const AUDIT = read(path.join(HERE, '..', 'directorate-titles-audit.json'));
const DROP = new Set(AUDIT.not_institutions);
const hasArabic = (s) => /[؀-ۿ]/.test(s ?? '');

const dataset = read(FILE);
const before = dataset.directorates.length;

// Branches hang off directorates by slug; dropping a directorate that still has
// branches would leave them pointing at nothing, so refuse rather than guess.
const orphaned = (dataset.branches ?? []).filter((b) => DROP.has(b.directorate_slug));
if (orphaned.length) {
  console.error(`${orphaned.length} branches belong to rows marked not_institutions; not dropping anything.`);
  for (const b of orphaned.slice(0, 10)) console.error(`  ${b.directorate_slug}`);
  process.exit(1);
}

dataset.directorates = dataset.directorates.filter((d) => !DROP.has(d.slug));

let translated = 0;
let corrected = 0;
for (const d of dataset.directorates) {
  if ((!d.title_en || hasArabic(d.title_en)) && TRANSLATIONS[d.title_ar]) {
    d.title_en = TRANSLATIONS[d.title_ar];
    d._title_en_source = 'reviewed translation';
    translated += 1;
  } else if (Object.hasOwn(AUDIT.replace, d.title_ar) && d.title_en !== AUDIT.replace[d.title_ar]) {
    d.title_en = AUDIT.replace[d.title_ar];
    d._title_en_source = 'reviewed translation (place match named another body)';
    corrected += 1;
  }
}

const stillArabic = dataset.directorates.filter((d) => !d.title_en || hasArabic(d.title_en));

fs.writeFileSync(FILE, JSON.stringify(dataset, null, 2));
console.log(`directorates: ${before} -> ${dataset.directorates.length} (${before - dataset.directorates.length} not institutions dropped)`);
console.log(`title_en: ${translated} translated, ${corrected} place-match names corrected`);
if (stillArabic.length) {
  console.log(`${stillArabic.length} still have no English name; the importer will fall back to Arabic:`);
  for (const d of stillArabic) console.log(`  ${d.slug}  —  ${d.title_ar}`);
}

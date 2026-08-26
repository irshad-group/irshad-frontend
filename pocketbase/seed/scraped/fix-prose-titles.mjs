#!/usr/bin/env node
/**
 * Repair the three directorate titles that are not names.
 *
 * The directorate pass reads a ministry's own structure pages, and three
 * entries came back as whatever text sat where a name should be: a sentence
 * about when a department was founded, a news headline that happens to contain
 * a company's name, and one record whose Kurdish and English names were
 * concatenated into every language field at once.
 *
 * Hand-written rather than pattern-matched. Three records is not a class, the
 * correct name is visible in each string, and a heuristic that rewrites titles
 * automatically is a far more dangerous thing to own than a table of three.
 * `clean-directorates.mjs` already withdraws headline-shaped *entries*; these
 * are real bodies wearing the wrong label, so they are repaired, not dropped.
 *
 * Only rewrites a title it still finds verbatim, so a re-run after the upstream
 * pass is fixed does nothing.
 *
 *   node fix-prose-titles.mjs [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const DRY = process.argv.includes('--dry');
const FILE = path.join(HERE, 'iraq-government-directory.json');
const dataset = JSON.parse(fs.readFileSync(FILE, 'utf8'));

const KURDISH_ENDOWMENTS = 'بەڕێوبەرایەتی گشتی ئەوقافی سلێمانی General Directorate of Endowments of Sulaimani';

const FIXES = [
  {
    slug: 'tasst-dayra-hqwq-alinsan-aam-1992',
    // "The Human Rights Department was founded in 1992." — the opening line of
    // the department's own description, scraped as its name.
    from: { title_ar: 'تأسست دائرة حقوق الإنسان عام 1992.' },
    to: { title_ar: 'دائرة حقوق الإنسان' },
  },
  {
    slug: 'balanfw-hrka-qtarat-alshrka-alaama-lskk-hdyd-alaraq',
    // "Infographic.. train movements of the General Company for Iraqi Railways"
    // — a headline from the ministry's news feed. The company inside it is real.
    from: { title_ar: 'بالانفو.. حركة قطارات الشركة العامة لسكك حديد العراق' },
    to: { title_ar: 'الشركة العامة لسكك حديد العراق' },
  },
  {
    slug: 'general-directorate-of-endowments-in-sulaymaniyah',
    // gov.krd prints the Kurdish and English names side by side in one heading,
    // and all three language fields took the whole heading. Split them apart.
    //
    // `title_ar` gets the English name rather than a translation. No source
    // gives this body an Arabic name and inventing one would look sourced
    // without being it; the schema requires `title_ar`, and the importer never
    // clears it, so leaving it empty is not available either. English is what
    // the fallback chain would have shown an Arabic reader anyway — this just
    // makes it explicit instead of showing them two languages at once.
    from: { title_ar: KURDISH_ENDOWMENTS, title_en: KURDISH_ENDOWMENTS, title_ku: KURDISH_ENDOWMENTS },
    to: {
      title_ar: 'General Directorate of Endowments of Sulaimani',
      title_en: 'General Directorate of Endowments of Sulaimani',
      title_ku: 'بەڕێوبەرایەتی گشتی ئەوقافی سلێمانی',
    },
  },
];

let applied = 0;
for (const fix of FIXES) {
  const row = dataset.directorates.find((d) => d.slug === fix.slug);
  if (!row) { console.log(`  not found, skipped: ${fix.slug}`); continue; }
  const stale = Object.entries(fix.from).some(([field, value]) => row[field] !== value);
  if (stale) { console.log(`  already changed upstream, left alone: ${fix.slug}`); continue; }
  for (const [field, value] of Object.entries(fix.to)) row[field] = value;
  row._title_repaired = 'scraped text was a sentence or a doubled heading, not a name';
  console.log(`  ${fix.slug}\n      -> ${fix.to.title_ar ?? fix.to.title_en}`);
  applied += 1;
}

console.log(`\n${applied} title(s) repaired.`);
if (DRY) { console.log('--dry: nothing written.'); process.exit(0); }
if (applied) fs.writeFileSync(FILE, JSON.stringify(dataset, null, 2));

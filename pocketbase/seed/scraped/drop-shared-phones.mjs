#!/usr/bin/env node
/**
 * Withdraw a phone number that sits on records belonging to different ministries.
 *
 * One number cannot be the switchboard of two ministries. Where Maps attached
 * the same number to bodies under more than one, at least one of them is wrong
 * and nothing in the data says which — the same situation `drop-ambiguous.mjs`
 * handles for locations, and it gets the same answer: withdraw rather than
 * guess. A wrong phone number in a government directory is worse than a blank
 * one, because a blank sends a reader to look it up and a wrong one sends them
 * to somebody else's office.
 *
 * Found while giving Defence the contact details its own website publishes:
 * `+964 773 048 5040` was on the human-rights directorate of Interior, Defence
 * *and* Justice, all three carrying the English name "Iraq High Commission for
 * Human Rights" — the independent commission's number, copied onto three
 * ministries that each happen to have a directorate of the same name.
 *
 * A number shared *within* one ministry is left alone: four offices of KRG
 * Labour and Social Affairs share a switchboard, which is ordinary. Only the
 * ministry holding the fewest records with a number loses it, and a tie means
 * no one has a claim, so every holder loses it.
 *
 *   node drop-shared-phones.mjs [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const DRY = process.argv.includes('--dry');
const FILE = path.join(HERE, 'iraq-government-directory.json');
const dataset = JSON.parse(fs.readFileSync(FILE, 'utf8'));

/** Every record that carries a phone, tagged with the ministry it belongs to. */
const holders = [
  ...dataset.ministries.map((m) => ({ row: m, ministry: m.slug, what: 'ministry' })),
  ...dataset.directorates.map((d) => ({ row: d, ministry: d.ministry_slug, what: 'directorate' })),
].filter((h) => h.row.phone);

const byPhone = new Map();
for (const h of holders) {
  if (!byPhone.has(h.row.phone)) byPhone.set(h.row.phone, []);
  byPhone.get(h.row.phone).push(h);
}

let cleared = 0;
for (const [phone, rows] of byPhone) {
  const perMinistry = new Map();
  for (const h of rows) perMinistry.set(h.ministry, (perMinistry.get(h.ministry) ?? 0) + 1);
  if (perMinistry.size < 2) continue;

  // The ministry with the most records holding this number keeps it — unless
  // several tie for the lead, in which case none of them has a better claim.
  const counts = [...perMinistry.values()];
  const top = Math.max(...counts);
  const leaders = [...perMinistry].filter(([, n]) => n === top).map(([m]) => m);
  const keeps = leaders.length === 1 ? leaders[0] : null;

  console.log(`${phone} — on ${rows.length} records across ${perMinistry.size} ministries`
    + (keeps ? `; kept on ${keeps}` : '; tied, so withdrawn from all'));
  for (const h of rows) {
    if (h.ministry === keeps) continue;
    console.log(`   cleared: ${h.ministry.padEnd(34)} ${String(h.row.title_ar).slice(0, 44)}`);
    h.row.phone = null;
    h.row._phone_withdrawn = `shared with ${perMinistry.size} ministries; no evidence which owns it`;
    cleared += 1;
  }
}

console.log(`\n${cleared} phone number(s) withdrawn.`);
if (DRY) { console.log('--dry: nothing written.'); process.exit(0); }
if (cleared) fs.writeFileSync(FILE, JSON.stringify(dataset, null, 2));

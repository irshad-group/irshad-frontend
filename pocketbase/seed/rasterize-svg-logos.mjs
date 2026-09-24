#!/usr/bin/env node
/**
 * Replace the SVG logos already in PocketBase with PNGs.
 *
 * The importer now rasterises on upload (see raster-logo.mjs), but nineteen
 * ministry logos were stored as SVG before that, and each one is a 44 kB file
 * downloaded in full to be drawn at 40 px because neither PocketBase's `thumb`
 * nor `next/image` will resize a vector. This converts what is already there,
 * so the fix does not wait for the next full `--files` import.
 *
 *   node pocketbase/seed/rasterize-svg-logos.mjs [--dry]
 *
 * Idempotent: a record whose logo is not an SVG is left alone, so re-running
 * costs one listing request and nothing else.
 */
import { rasterizeLogo } from './raster-logo.mjs';

const BASE = (process.env.NEXT_PUBLIC_PB_URL || '').replace(/\/$/, '');
const EMAIL = process.env.PB_ADMIN_EMAIL;
const PASSWORD = process.env.PB_ADMIN_PASSWORD;
const DRY = process.argv.includes('--dry');

if (!BASE || !EMAIL || !PASSWORD) {
  console.error('Set NEXT_PUBLIC_PB_URL, PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD.');
  process.exit(1);
}

/** Collections whose logo field may hold an SVG. */
const TARGETS = [{ collection: 'ministries', field: 'logo' }];

const auth = await fetch(`${BASE}/api/collections/_superusers/auth-with-password`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ identity: EMAIL, password: PASSWORD }),
});
if (!auth.ok) {
  console.error(`Sign-in failed: ${auth.status} ${await auth.text()}`);
  process.exit(1);
}
const H = { Authorization: (await auth.json()).token };

let converted = 0;
let skipped = 0;
let failed = 0;

for (const { collection, field } of TARGETS) {
  const list = await fetch(
    `${BASE}/api/collections/${collection}/records?perPage=500&fields=id,slug,${field}`,
    { headers: H },
  );
  const { items } = await list.json();

  for (const record of items) {
    const file = record[field];
    if (!file || !file.toLowerCase().endsWith('.svg')) { skipped += 1; continue; }

    const url = `${BASE}/api/files/${collection}/${record.id}/${file}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status} fetching the current file`);
      const original = Buffer.from(await res.arrayBuffer());
      const raster = await rasterizeLogo(original, res.headers.get('content-type') || 'image/svg+xml');
      if (!raster) throw new Error('not recognised as SVG');

      console.log(
        `  ${record.slug.padEnd(38)} ${String(Math.round(original.length / 1024)).padStart(3)} kB svg`
        + ` -> ${String(Math.round(raster.buffer.length / 1024)).padStart(3)} kB png`,
      );
      if (DRY) { converted += 1; continue; }

      const form = new FormData();
      form.append(field, new Blob([raster.buffer], { type: raster.type }), `${field}.${raster.ext}`);
      const patch = await fetch(`${BASE}/api/collections/${collection}/records/${record.id}`, {
        method: 'PATCH',
        headers: H,
        body: form,
      });
      if (!patch.ok) throw new Error(`${patch.status} ${(await patch.text()).slice(0, 200)}`);
      converted += 1;
    } catch (error) {
      failed += 1;
      console.error(`  ${record.slug}: ${error.message}`);
    }
  }
}

console.log(`\n${DRY ? 'Would convert' : 'Converted'} ${converted}, left ${skipped} alone, ${failed} failed.`);
process.exit(failed ? 1 : 0);

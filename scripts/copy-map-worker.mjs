#!/usr/bin/env node
/**
 * Copy MapLibre's worker bundle into `public/vendor/`.
 *
 * maplibre-gl 6 runs tile parsing in a separate ESM worker and works out that
 * worker's URL from its own module URL. Next's bundler rewrites the module, the
 * resolution collapses to the page URL, and `new Worker('/ar')` loads the HTML
 * document as a script. It fails silently: the map builds, markers attach, no
 * error event fires — and no tile is ever parsed, so `load` never fires and the
 * map sits invisible behind its fallback forever.
 *
 * Serving the worker from our own origin and pointing `setWorkerUrl` at it side-
 * steps the bundler entirely. Both files are needed and must stay siblings: the
 * worker is a module and imports the shared chunk by relative path.
 *
 * The copies are committed *and* refreshed here on every build. Committed
 * because a host that runs `next build` directly never fires `prebuild`, and a
 * missing worker breaks the map in exactly the silent way described above.
 * Refreshed because a stale worker against a newer library breaks the same way —
 * bumping maplibre-gl updates the vendored copy without anyone remembering to.
 */
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FROM = join(ROOT, 'node_modules', 'maplibre-gl', 'dist');
const TO = join(ROOT, 'public', 'vendor');

const FILES = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs'];

if (!existsSync(FROM)) {
  console.error(`maplibre-gl not installed at ${FROM} — run npm install first.`);
  process.exit(1);
}

mkdirSync(TO, { recursive: true });
for (const file of FILES) {
  const from = join(FROM, file);
  if (!existsSync(from)) {
    console.error(`Expected ${file} in maplibre-gl's dist. Its layout has changed;`
      + ' check how the worker is published before bumping the dependency.');
    process.exit(1);
  }
  copyFileSync(from, join(TO, file));
}
console.log(`Copied ${FILES.length} MapLibre worker file(s) into public/vendor/.`);

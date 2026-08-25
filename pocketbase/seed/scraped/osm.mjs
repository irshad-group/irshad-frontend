// OpenStreetMap enrichment.
//
// Google Maps' search response only ever carries *today's* opening interval, so it
// cannot fill a weekly schedule. OSM carries the full week in `opening_hours`, plus
// `name:en` / `name:ar` / `name:ckb`, which is also the cheapest source of the
// English and Kurdish names the scrape otherwise lacks.
//
// Data © OpenStreetMap contributors, ODbL.
import fs from 'node:fs';
import path from 'node:path';
import { norm } from './match.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));

export function load(file = 'osm-gov.json') {
  const j = JSON.parse(fs.readFileSync(path.join(HERE, file), 'utf8'));
  return j.elements
    .map((e) => {
      const lat = e.lat ?? e.center?.lat;
      const lon = e.lon ?? e.center?.lon;
      if (lat == null || lon == null) return null;
      return { id: `${e.type}/${e.id}`, lat, lon, tags: e.tags || {} };
    })
    .filter(Boolean);
}

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const CODE = { Mo: 'MON', Tu: 'TUE', We: 'WED', Th: 'THU', Fr: 'FRI', Sa: 'SAT', Su: 'SUN' };
const ORDER = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function expandDays(spec) {
  const out = [];
  for (const part of spec.split(',')) {
    const m = part.trim().match(/^([A-Za-z]{2})(?:\s*-\s*([A-Za-z]{2}))?$/);
    if (!m) continue;
    const a = DAYS.indexOf(m[1]);
    if (a < 0) continue;
    if (!m[2]) { out.push(DAYS[a]); continue; }
    const b = DAYS.indexOf(m[2]);
    if (b < 0) continue;
    for (let i = a; ; i = (i + 1) % 7) { out.push(DAYS[i]); if (i === b) break; }
  }
  return out;
}

/**
 * Parse the OSM `opening_hours` string into the shape `directorates.working_hours`
 * already uses. Only the subset that actually occurs on Iraqi government offices is
 * handled — day ranges, time ranges, `24/7`, `off`. Anything richer (month rules,
 * public-holiday clauses) returns null rather than a half-parsed schedule.
 */
export function parseOpeningHours(str) {
  if (!str || typeof str !== 'string') return null;
  const s = str.trim();
  if (/PH|SH|week |easter|\[|\bJan\b|\bDec\b/i.test(s)) return null;
  if (/^24\/7$/i.test(s)) return ORDER.map((day) => ({ day, from: '00:00', to: '24:00' }));

  // A bare time range with no day prefix means every day.
  const bare = s.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
  if (bare) {
    const from = `${bare[1].padStart(2, '0')}:${bare[2]}`;
    const to = `${bare[3].padStart(2, '0')}:${bare[4]}`;
    return ORDER.map((day) => ({ day, from, to }));
  }

  const byDay = new Map();
  for (const rule of s.split(';')) {
    const r = rule.trim();
    if (!r) continue;
    const m = r.match(/^([A-Za-z]{2}(?:\s*-\s*[A-Za-z]{2})?(?:\s*,\s*[A-Za-z]{2}(?:\s*-\s*[A-Za-z]{2})?)*)\s+(.+)$/);
    if (!m) return null;
    const days = expandDays(m[1]);
    if (!days.length) return null;
    const spanRaw = m[2].trim();
    if (/^(off|closed)$/i.test(spanRaw)) {
      for (const d of days) byDay.set(CODE[d], { day: CODE[d], from: null, to: null });
      continue;
    }
    // "08:00-10:00, 11:00-13:00" — a lunch break. working_hours holds one span per
    // day, so record the outer envelope and say why in the note.
    const spans = [...spanRaw.matchAll(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/g)];
    if (!spans.length) return null;
    const pad = (h, mm) => `${h.padStart(2, '0')}:${mm}`;
    const from = pad(spans[0][1], spans[0][2]);
    const last = spans[spans.length - 1];
    const to = pad(last[3], last[4]);
    const note = spans.length > 1
      ? spans.map((x) => `${pad(x[1], x[2])}-${pad(x[3], x[4])}`).join(', ')
      : undefined;
    for (const d of days) byDay.set(CODE[d], note
      ? { day: CODE[d], from, to, note }
      : { day: CODE[d], from, to });
  }
  if (!byDay.size) return null;
  // Days the string never mentions are closed, not unknown.
  return ORDER.map((day) => byDay.get(day) || { day, from: null, to: null });
}

const R = Math.PI / 180;
/** Metres between two points (equirectangular is plenty at city scale). */
export function metres(aLat, aLon, bLat, bLon) {
  const x = (bLon - aLon) * R * Math.cos(((aLat + bLat) / 2) * R);
  const y = (bLat - aLat) * R;
  return Math.sqrt(x * x + y * y) * 6371000;
}

/** Share of the shorter name's words that appear in the other. */
export function nameOverlap(a, b) {
  const wa = norm(a).split(' ').filter((w) => w.length > 2);
  const nb = norm(b);
  if (!wa.length) return 0;
  let hit = 0;
  for (const w of wa) if (nb.includes(w)) hit += 1;
  return hit / wa.length;
}

/**
 * Nearest OSM feature to a record. Requires either a close coordinate match or a
 * looser one backed by the names agreeing — a government compound can hold several
 * offices, so distance alone is not enough to claim identity.
 */
export function findNear(osm, lat, lon, name, { hard = 120, soft = 400 } = {}) {
  if (lat == null || lon == null) return null;
  let best = null;
  for (const o of osm) {
    const d = metres(lat, lon, o.lat, o.lon);
    if (d > soft) continue;
    const oname = o.tags.name || o.tags['name:ar'] || o.tags['name:en'] || '';
    const sim = name && oname ? nameOverlap(name, oname) : 0;
    const ok = d <= hard || sim >= 0.5;
    if (!ok) continue;
    const score = sim * 1000 - d;
    if (!best || score > best.score) best = { osm: o, d, sim, score };
  }
  return best;
}

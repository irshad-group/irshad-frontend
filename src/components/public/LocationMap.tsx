import { TILE_SIZE, tileGrid, tileUrl } from '@/lib/public/tiles';
import InteractiveLocationMap from './InteractiveLocationMap';

/**
 * The office on a map.
 *
 * Two layers. The server draws a picture of the location out of ordinary tile
 * images, so something correct is on screen immediately, with no JavaScript and
 * no map library. `InteractiveLocationMap` then replaces it with a real
 * pannable, zoomable map once that library has loaded. If it never loads — JS
 * off, a slow connection, a blocked host — the picture stays, which is the
 * whole point of building it in that order.
 *
 * A record with one coordinate, a swapped pair, or the 0,0 this dataset uses to
 * mean "not filled in" renders nothing at all: no map beats a map of the wrong
 * place, the same rule `mapsLink` follows.
 */
export default function LocationMap({
  lat,
  lon,
  href,
  label,
  dir,
}: {
  lat?: number;
  lon?: number;
  href: string;
  label: string;
  dir: 'ltr' | 'rtl';
}) {
  const grid = tileGrid(lat, lon, { zoom: 15, width: 640, height: 260 });
  if (!grid || typeof lat !== 'number' || typeof lon !== 'number') return null;

  return (
    <div className="relative mt-2 overflow-hidden border border-ink-200 bg-ink-100" style={{ height: grid.height }}>
      <div aria-hidden="true" className="absolute inset-0">
        {grid.tiles.map((tile) => (
          // eslint-disable-next-line @next/next/no-img-element -- Raster map tiles: fixed 256px, nothing to optimise.
          <img
            key={`${tile.x}-${tile.y}`}
            src={tileUrl(tile, grid.zoom)}
            alt=""
            width={TILE_SIZE}
            height={TILE_SIZE}
            loading="lazy"
            decoding="async"
            className="absolute max-w-none"
            style={{ left: tile.left, top: tile.top }}
          />
        ))}
        {/* Offset so the tip of the pin, not the middle of its head, is on the point. */}
        <span className="absolute start-1/2 top-1/2 -ms-3 -mt-6 block size-6 text-brand-600">
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-6 drop-shadow">
            <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
          </svg>
        </span>
        <span
          dir="ltr"
          className="absolute bottom-0 end-0 bg-white/85 px-1.5 py-0.5 text-[10px] leading-tight text-ink-500"
        >
          © OpenStreetMap, © CARTO
        </span>
      </div>

      <InteractiveLocationMap lat={lat} lon={lon} zoom={grid.zoom} dir={dir} />

      {/* Above the map so it stays reachable while panning, on the leading edge
          at the top: it began as a bar across the bottom, which covered the very
          thing the reader opened the panel to look at, and the bottom is also
          where MapLibre puts its own attribution. */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-2 start-2 z-10 inline-flex min-h-9 items-center gap-1.5 border border-ink-300 bg-white/95 px-3 text-sm font-semibold text-brand-700 shadow-sm hover:border-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="size-4">
          <path d="M9 3 3 5.5v15L9 18l6 3 6-2.5v-15L15 6 9 3Z" strokeLinejoin="round" />
          <path d="M9 3v15M15 6v15" />
        </svg>
        {label}
      </a>
    </div>
  );
}

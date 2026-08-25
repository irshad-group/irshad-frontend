import { TILE_SIZE, tileGrid, tileUrl } from '@/lib/public/tiles';

/**
 * A small map of one office, which opens the visitor's own maps application
 * when clicked.
 *
 * Built from ordinary `<img>` tiles rather than a map library. The portal has
 * to stay usable with JavaScript switched off, and a canvas map is exactly the
 * kind of thing that leaves a grey rectangle when it is not: this renders on
 * the server, so the map is in the HTML and needs nothing to run. It also keeps
 * a directorate page — already carrying up to sixty office cards — from taking
 * on ~230 kB of map library for a picture of one building.
 *
 * Still not an iframe embed. `mapsLink` explains why at length: an embed is the
 * heaviest thing on the page and hands the visitor's IP to a third party before
 * they have asked for a map. Nine small tiles is a far smaller version of that
 * trade, made only where the location is the point of the box.
 *
 * The whole thing is one link. The tiles do not pan or zoom, so a drag can
 * never swallow a tap on a phone, which is where this gets used.
 */
export default function LocationMap({
  lat,
  lon,
  href,
  label,
}: {
  lat?: number;
  lon?: number;
  href: string;
  label: string;
}) {
  const grid = tileGrid(lat, lon);
  if (!grid) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="group mt-2 block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
    >
      <div
        className="relative overflow-hidden border border-ink-200 bg-ink-100"
        style={{ height: grid.height }}
      >
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
        </div>

        {/* The pin marks the exact point, which is the centre of the box by
            construction — see tileGrid. Offset so the tip, rather than the
            middle of the head, sits on the coordinate. */}
        <span
          aria-hidden="true"
          className="absolute start-1/2 top-1/2 -ms-3 -mt-6 block size-6 text-brand-600"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-6 drop-shadow">
            <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
          </svg>
        </span>

        <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-white/95 px-3 py-2">
          <span className="text-sm font-semibold text-brand-700 group-hover:underline">{label}</span>
          {/* Required by the tile provider and by OpenStreetMap's licence.
              Forced LTR: these are Latin names, and in an RTL paragraph the
              leading © migrates to the far end and reads as trailing junk. */}
          <span dir="ltr" className="text-[10px] leading-tight text-ink-500">
            © OpenStreetMap, © CARTO
          </span>
        </span>
      </div>
    </a>
  );
}

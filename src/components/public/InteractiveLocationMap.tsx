'use client';

import { useEffect, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * Upgrades the server-rendered tile picture behind it into a real map you can
 * pan and zoom.
 *
 * The static tiles stay in the HTML underneath and are what a reader sees first,
 * or sees permanently if JavaScript is off or the library fails to load — so the
 * map is never a grey rectangle, and the address panel is useful before ~230 kB
 * of map library has been fetched. This mounts on top only once tiles have
 * actually rendered.
 *
 * Scroll zooming needs a modifier key (two fingers on a touchscreen), matching
 * the home page: a map halfway down a long page must not swallow the scroll.
 */
export default function InteractiveLocationMap({
  lat,
  lon,
  zoom = 15,
  dir,
}: {
  lat: number;
  lon: number;
  zoom?: number;
  dir: 'ltr' | 'rtl';
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let map: import('maplibre-gl').Map | undefined;

    (async () => {
      const maplibregl = await import('maplibre-gl');
      if (cancelled || !containerRef.current) return;

      // See scripts/copy-map-worker.mjs: the bundler cannot resolve maplibre's
      // own worker URL, and the failure is silent.
      if (!maplibregl.getWorkerUrl()) {
        maplibregl.setWorkerUrl('/vendor/maplibre-gl-worker.mjs');
      }
      if (maplibregl.getRTLTextPluginStatus() === 'unavailable') {
        void maplibregl.setRTLTextPlugin('/vendor/mapbox-gl-rtl-text.min.js', true);
      }

      const instance = new maplibregl.Map({
        container: containerRef.current,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [lon, lat],
        zoom,
        cooperativeGestures: true,
        attributionControl: { compact: true },
      });
      map = instance;
      // Trailing edge, so it never sits under the "open in maps" button on the
      // leading one.
      instance.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        dir === 'rtl' ? 'top-left' : 'top-right',
      );
      new maplibregl.Marker({ color: '#1b5e4b' }).setLngLat([lon, lat]).addTo(instance);
      instance.on('load', () => {
        if (cancelled) return;
        // Compact attribution renders expanded on first paint, and two lines of
        // it covers a third of a map this size. Collapse it behind its (i), which
        // is the standard pattern and keeps the credit one tap away — the licence
        // requires it be available, not that it sit on top of the map.
        containerRef.current
          ?.querySelector('.maplibregl-ctrl-attrib.maplibregl-compact')
          ?.classList.remove('maplibregl-compact-show');
        setReady(true);
      });
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [lat, lon, zoom, dir]);

  return (
    <div
      ref={containerRef}
      aria-hidden={!ready}
      className={`absolute inset-0 transition-opacity ${ready ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
    />
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';

export type CityMarker = {
  lat: number;
  lon: number;
  label: string;
  count: number;
  href: string;
  big: boolean;
};

/**
 * A real, zoomable vector map of Iraq (MapLibre GL over OpenFreeMap tiles)
 * with one marker per province that has offices, as progressive enhancement:
 * the server renders the static SVG fallback, and this replaces it once the
 * map has actually loaded. No JavaScript, a failed tile server, or a data-
 * saver browser all leave the fallback in place — the page never depends on
 * the network beyond our own origin.
 *
 * maplibre-gl is imported dynamically inside the effect so its ~230 kB never
 * enters the initial bundle. The RTL text plugin is self-hosted; without it
 * Arabic tile labels render with disjoined letters.
 */
export default function InteractiveMap({
  markers,
  dir,
  fallback,
}: {
  markers: CityMarker[];
  dir: 'ltr' | 'rtl';
  fallback: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let map: import('maplibre-gl').Map | undefined;

    (async () => {
      const maplibregl = await import('maplibre-gl');
      if (cancelled || !containerRef.current) return;

      if (maplibregl.getRTLTextPluginStatus() === 'unavailable') {
        // Lazy: the worker only fetches the plugin when RTL text first appears.
        void maplibregl.setRTLTextPlugin('/vendor/mapbox-gl-rtl-text.min.js', true);
      }

      const instance = new maplibregl.Map({
        container: containerRef.current,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [43.68, 33.9],
        zoom: 4.7,
        minZoom: 4,
        maxZoom: 14,
        // Scroll only zooms with a modifier key / two fingers, so the map
        // cannot trap the page scroll on phones.
        cooperativeGestures: true,
        attributionControl: { compact: true },
      });
      map = instance;
      instance.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        dir === 'rtl' ? 'top-left' : 'top-right',
      );

      for (const marker of markers) {
        const element = document.createElement('a');
        element.href = marker.href;
        element.setAttribute('aria-label', `${marker.label} (${marker.count})`);
        element.className = 'group block cursor-pointer';
        element.innerHTML = marker.big
          ? `<span class="flex items-center gap-1.5 border border-ink-950/20 bg-white px-2 py-1 text-xs font-bold text-ink-950 shadow-[0_2px_8px_rgba(11,16,48,0.18)] transition-colors group-hover:border-brand-500 group-hover:text-brand-500"><span class="inline-block size-2 shrink-0 rounded-full bg-brand-500"></span>${escapeHtml(marker.label)}<span class="font-semibold text-ink-500">${marker.count}</span></span>`
          : `<span class="block size-3 rounded-full border-2 border-white bg-brand-500 shadow-[0_1px_4px_rgba(11,16,48,0.3)] transition-transform group-hover:scale-125" title="${escapeHtml(marker.label)}"></span>`;
        new maplibregl.Marker({ element }).setLngLat([marker.lon, marker.lat]).addTo(instance);
      }

      instance.on('load', () => {
        if (!cancelled) setLoaded(true);
      });
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [markers, dir]);

  return (
    <div className="relative h-[420px] overflow-hidden border border-ink-200 bg-white sm:h-[520px]">
      {!loaded ? <div className="absolute inset-0 flex items-center justify-center">{fallback}</div> : null}
      <div
        ref={containerRef}
        className={loaded ? 'absolute inset-0' : 'absolute inset-0 opacity-0'}
        aria-hidden={!loaded}
      />
    </div>
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

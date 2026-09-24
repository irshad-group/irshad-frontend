import { wazeEmbedUrl } from '@/lib/public/places';

/**
 * The office on the Waze live map, with directions to it underneath.
 *
 * Waze rather than a map of the portal's own, because Waze is what people here
 * navigate with: the map a reader looks at is the one they will then drive
 * with, and "Expand map" hands them straight into it.
 *
 * What the frame costs, and how that cost is contained:
 *
 * - It is a third-party page — about sixty requests to Waze and Google once it
 *   loads, including a reCAPTCHA. `loading="lazy"` means none of that happens
 *   until the map is near the viewport; a reader who never scrolls to it
 *   sends Waze nothing.
 * - `referrerPolicy="no-referrer"`, so Waze is not told which office page the
 *   reader was on.
 * - `sandbox` without `allow-top-navigation`, so the frame can open Waze in a
 *   new tab ("Expand map" needs `allow-popups`) but can never navigate this
 *   page away from under the reader. `allow-same-origin` is required: without
 *   it the map cannot reach its own origin and draws nothing.
 *
 * The directions link sits *below* the frame, not over it: Waze puts its own
 * search box in the top corner, and anything laid on top of a cross-origin
 * frame is fighting it for the same pixels. Below, it is also the part that
 * still works when the frame does not — scripts off, or Waze unreachable.
 *
 * Renders nothing without usable coordinates; see `wazeEmbedUrl`.
 */
export default function OfficeMap({
  lat,
  lon,
  locale,
  href,
  labels,
}: {
  lat?: number;
  lon?: number;
  locale: string;
  href: string;
  labels: { mapTitle: string; openInMaps: string };
}) {
  const src = wazeEmbedUrl(lat, lon, locale);
  if (!src) return null;

  return (
    <div className="mt-2">
      <div className="relative h-[260px] overflow-hidden border border-ink-200 bg-ink-100">
        <iframe
          src={src}
          title={labels.mapTitle}
          loading="lazy"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          className="absolute inset-0 size-full border-0"
        />
      </div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex min-h-9 items-center gap-1.5 border border-ink-300 bg-white px-3 text-sm font-semibold text-brand-700 hover:border-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="size-4">
          <path d="M9 3 3 5.5v15L9 18l6 3 6-2.5v-15L15 6 9 3Z" strokeLinejoin="round" />
          <path d="M9 3v15M15 6v15" />
        </svg>
        {labels.openInMaps}
      </a>
    </div>
  );
}

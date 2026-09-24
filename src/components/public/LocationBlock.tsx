import { mapsLink } from '@/lib/public/places';
import LocationMap from './LocationMap';

/**
 * An address, and — only when the coordinates are usable — a link that opens
 * the location in whatever maps application the visitor already has.
 *
 * Not an embedded map. An embed is usually the heaviest thing on the page and
 * hands every visitor's IP to a third party before they have asked for a map;
 * on a government service that is a real cost for something most visitors do
 * not need.
 *
 * With no address and no usable coordinates this renders nothing at all rather
 * than an empty heading or a broken frame.
 *
 * `withMap` adds a small self-rendered map above the link — see LocationMap. It
 * is opt-in rather than automatic because this component also renders inside
 * every provincial office card, and a directorate with sixty-one offices would
 * otherwise mount sixty-one maps on one page.
 */
export default function LocationBlock({
  address,
  lat,
  lon,
  labels,
  withMap = false,
  dir = 'ltr',
}: {
  address: string;
  lat?: number;
  lon?: number;
  labels: { heading: string; openInMaps: string };
  withMap?: boolean;
  dir?: 'ltr' | 'rtl';
}) {
  const link = mapsLink(lat, lon);
  if (!address && !link) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-ink-900">{labels.heading}</h3>
      {address ? <p className="mt-1 text-sm text-ink-600">{address}</p> : null}
      {link && withMap && typeof lat === 'number' && typeof lon === 'number' ? (
        <LocationMap lat={lat} lon={lon} href={link} label={labels.openInMaps} dir={dir} />
      ) : link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex min-h-6 items-center text-sm text-brand-700 underline"
        >
          {labels.openInMaps}
        </a>
      ) : null}
    </div>
  );
}

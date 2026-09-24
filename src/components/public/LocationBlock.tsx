import { mapsLink } from '@/lib/public/places';
import OfficeMap from './OfficeMap';

/**
 * An address, and — only when the coordinates are usable — a way to get there
 * in Waze.
 *
 * By default that is just a link. `withMap` puts the office on the Waze live
 * map above it — see OfficeMap for what the frame costs and how that is
 * contained. It is opt-in rather than automatic because this component also
 * renders inside every provincial office card, and a directorate with
 * sixty-one offices would otherwise frame sixty-one third-party maps on one
 * page.
 *
 * With no address and no usable coordinates this renders nothing at all rather
 * than an empty heading or a broken frame.
 */
export default function LocationBlock({
  address,
  lat,
  lon,
  labels,
  withMap = false,
  locale = 'ar',
}: {
  address: string;
  lat?: number;
  lon?: number;
  labels: { heading: string; openInMaps: string; mapTitle?: string };
  withMap?: boolean;
  locale?: string;
}) {
  const link = mapsLink(lat, lon);
  if (!address && !link) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-ink-900">{labels.heading}</h3>
      {address ? <p className="mt-1 text-sm text-ink-600">{address}</p> : null}
      {link && withMap ? (
        <OfficeMap
          lat={lat}
          lon={lon}
          locale={locale}
          href={link}
          labels={{ mapTitle: labels.mapTitle ?? labels.heading, openInMaps: labels.openInMaps }}
        />
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

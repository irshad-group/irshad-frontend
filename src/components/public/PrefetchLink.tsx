'use client';

import { useState, type ComponentProps } from 'react';
import { Link } from '@/i18n/navigation';

/**
 * A link that does not prefetch until the reader shows intent.
 *
 * Next prefetches every `<Link>` that enters the viewport. On a listing of
 * sixty offices that is sixty route payloads — and each one carries the
 * preload hints for that page's photographs and map tiles, so the browser
 * downloads them too. Measured on `/ar/directorates`: 1,581 kB fetched for a
 * page that needs 193 kB, none of it anything the reader had asked to see.
 *
 * Hover and keyboard focus are the intent signals; `prefetch={null}` then
 * restores Next's default behaviour, so a reader aiming at a card still gets
 * the instant navigation. Touch deliberately is not a signal: on a phone the
 * tap *is* the navigation, so prefetching there would re-spend exactly the
 * bandwidth this is protecting — and phones on weak connections are most of
 * the audience.
 */
export default function PrefetchLink({
  children,
  ...props
}: ComponentProps<typeof Link>) {
  const [intent, setIntent] = useState(false);
  const show = () => setIntent(true);

  return (
    <Link {...props} prefetch={intent ? null : false} onMouseEnter={show} onFocus={show}>
      {children}
    </Link>
  );
}

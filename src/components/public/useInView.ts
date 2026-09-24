'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * True once the element has come within `rootMargin` of the viewport, and true
 * from then on.
 *
 * For work that is only worth doing if the reader actually reaches it — the
 * maps, each of which pulls ~230 kB of library plus a dozen tiles. Mounting
 * those on page load spends a phone's bandwidth on something halfway down a
 * page it may never scroll to, and does it while the page above is still
 * arriving.
 *
 * Latches rather than tracking: a map that has loaded should not be torn down
 * because it scrolled away, and reloading it if the reader scrolls back would
 * cost more than keeping it.
 */
export function useInView<T extends HTMLElement>(rootMargin = '400px') {
  const ref = useRef<T | null>(null);
  // A browser with no IntersectionObserver starts out "in view", so the work
  // simply happens on mount as it did before. Deciding that in the initial
  // state rather than in the effect avoids a second render.
  const [inView, setInView] = useState(() => typeof IntersectionObserver !== 'function');

  useEffect(() => {
    const element = ref.current;
    if (!element || inView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [inView, rootMargin]);

  return [ref, inView] as const;
}

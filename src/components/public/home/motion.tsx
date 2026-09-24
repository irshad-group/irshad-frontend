'use client';

import { LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Scroll-reveal animation as a client leaf. The children are rendered on the
 * server and passed through, so the content is in the HTML regardless — with
 * JavaScript disabled the initial hidden state is never applied and everything
 * is simply visible. `LazyMotion` keeps only the DOM-animation subset of
 * framer-motion in the bundle.
 */
export function Reveal({
  children,
  delay = 0,
  onMount = false,
  className,
}: {
  children: ReactNode;
  /** Seconds; used to stagger items inside a grid. */
  delay?: number;
  /** Animate immediately on mount (hero) instead of when scrolled into view. */
  onMount?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  const target = { opacity: 1, y: 0 };
  const transition = { duration: 0.55, ease: [0.21, 0.65, 0.36, 1] as const, delay };

  return (
    <LazyMotion features={domAnimation} strict>
      {onMount ? (
        <m.div
          className={className}
          initial={{ opacity: 0, y: 20 }}
          animate={target}
          transition={transition}
        >
          {children}
        </m.div>
      ) : (
        <m.div
          className={className}
          initial={{ opacity: 0, y: 24 }}
          whileInView={target}
          viewport={{ once: true, margin: '-64px' }}
          transition={transition}
        >
          {children}
        </m.div>
      )}
    </LazyMotion>
  );
}

'use client';

import { useCallback, useRef } from 'react';

/**
 * A photo that opens full size over the page when clicked, with a close button
 * in the top corner.
 *
 * Progressive enhancement, so it works before and without JavaScript: the
 * server renders a plain link to the full-size image, and this upgrades that
 * link into a dialog. With JS off the link still opens the photo, which is the
 * behaviour a reader expects from a picture anyway.
 *
 * Built on `<dialog>` rather than a hand-rolled overlay, which buys the parts
 * that are easy to get wrong for free: Escape closes it, focus is trapped
 * inside while it is open and returns to the thumbnail afterwards, and the rest
 * of the page is inert to a screen reader.
 */
export default function Lightbox({
  src,
  full,
  alt,
  closeLabel,
  className,
  children,
}: {
  /** Thumbnail shown in the page. */
  src: string;
  /** Full-size image shown in the dialog. */
  full: string;
  alt: string;
  closeLabel: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  // No "have we hydrated yet" flag is needed: before hydration there is no
  // click handler, so the anchor behaves like an anchor and opens the photo.
  const close = useCallback(() => dialogRef.current?.close(), []);

  return (
    <>
      <a
        href={full}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={(event) => {
          if (!dialogRef.current) return;
          // Leave the modified clicks alone — they mean "open this elsewhere".
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
          event.preventDefault();
          dialogRef.current.showModal();
        }}
      >
        {children ?? (
          // eslint-disable-next-line @next/next/no-img-element -- PocketBase thumb at a fixed size.
          <img src={src} alt={alt} loading="lazy" decoding="async" className="size-full object-cover" />
        )}
      </a>

      <dialog
        ref={dialogRef}
        aria-label={alt}
        // The backdrop is part of the dialog's own box, so a click that lands on
        // the element itself rather than on the picture is a click outside.
        onClick={(event) => { if (event.target === dialogRef.current) close(); }}
        className="m-auto max-h-[92dvh] max-w-[95vw] bg-transparent p-0 backdrop:bg-ink-950/80"
      >
        <div className="relative">
          <button
            type="button"
            onClick={close}
            aria-label={closeLabel}
            autoFocus
            className="absolute end-2 top-2 z-10 flex size-11 items-center justify-center rounded-full bg-ink-950/70 text-white hover:bg-ink-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true" className="size-5">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element -- Full-size record photo; Next cannot know its dimensions. */}
          <img src={full} alt={alt} className="block max-h-[92dvh] max-w-[95vw] object-contain" />
        </div>
      </dialog>
    </>
  );
}

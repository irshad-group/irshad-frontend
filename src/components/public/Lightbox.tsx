'use client';

import { useCallback, useRef, useState } from 'react';

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
 *
 * The full-size photo is not requested until the dialog is opened. A closed
 * `<dialog>` still loads the images inside it, so every visitor to a ministry
 * page was downloading a 350 kB photograph to look at a banner — on the pages
 * measured, more than a third of everything the page fetched. Until then the
 * dialog points at the banner image the page has already loaded, so opening
 * shows the photo instantly and the full-resolution one replaces it when it
 * arrives, rather than opening onto an empty frame.
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
  const anchorRef = useRef<HTMLAnchorElement | null>(null);
  // What the dialog is currently showing. Null until it has been opened once,
  // so a closed dialog costs no request at all.
  const [shown, setShown] = useState<string | null>(null);

  // No "have we hydrated yet" flag is needed: before hydration there is no
  // click handler, so the anchor behaves like an anchor and opens the photo.
  const close = useCallback(() => dialogRef.current?.close(), []);

  return (
    <>
      <a
        ref={anchorRef}
        href={full}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={(event) => {
          if (!dialogRef.current) return;
          // Leave the modified clicks alone — they mean "open this elsewhere".
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
          event.preventDefault();
          // Open on whatever the browser already has for the banner, so the
          // photo is there the instant it is asked for. Reading `currentSrc`
          // rather than `src` picks the exact variant the optimiser served for
          // this screen, which is the one in cache.
          const rendered = anchorRef.current?.querySelector('img')?.currentSrc;
          setShown(rendered || full);
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
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element -- Full-size record photo; Next cannot know its dimensions.
            <img
              src={shown}
              alt={alt}
              // Once the cached banner is on screen, fetch the real thing and
              // let it replace it. The browser keeps painting the old image
              // until the new one has decoded, so the swap is not visible as a
              // flash of nothing.
              onLoad={() => { if (shown !== full) setShown(full); }}
              className="block max-h-[92dvh] max-w-[95vw] object-contain"
            />
          ) : null}
        </div>
      </dialog>
    </>
  );
}

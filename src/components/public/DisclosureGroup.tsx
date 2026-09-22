'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Progressive enhancement for a set of `<details>` menus.
 *
 * Native disclosures open and close on their own, which is why the header uses
 * them: the menu works before, or without, any script. What they do not do is
 * behave like a menu once several sit side by side — a click elsewhere leaves
 * one hanging open, two can be open at once, Escape does nothing, and after a
 * client-side navigation the layout is reused, so the menu a link was chosen
 * from is still open on the next page.
 *
 * This wrapper adds exactly those four behaviours, by direct DOM listeners
 * rather than React state, so the markup below stays plain server-rendered
 * HTML and nothing here is needed for the menu to open in the first place.
 *
 * An element marked `data-dismiss` inside the group (the drawer backdrop)
 * counts as "elsewhere".
 */
export default function DisclosureGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const group = root.current;
    if (!group) return;

    const openMenus = () => Array.from(group.querySelectorAll<HTMLDetailsElement>('details[open]'));
    const closeAll = (except?: HTMLDetailsElement) => {
      for (const menu of openMenus()) if (menu !== except) menu.open = false;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Element && !group.contains(event.target)) closeAll();
    };
    const onClick = (event: MouseEvent) => {
      // Choosing a link is the end of the interaction, whether or not the URL
      // path changes — `?krg=true` to `?krg=false` re-renders in place. The
      // backdrop is handled here too, on `click` rather than `pointerdown`:
      // both sit inside the menu, and hiding the element under a pointer
      // while its gesture is still in flight crashes Chromium's renderer.
      if (event.target instanceof Element && event.target.closest('a[href], [data-dismiss]')) {
        closeAll();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const [open] = openMenus();
      if (!open) return;
      closeAll();
      // Return focus to the trigger so keyboard users are not dropped on body.
      open.querySelector<HTMLElement>('summary')?.focus();
    };
    const onToggle = (event: Event) => {
      const menu = event.target as HTMLDetailsElement;
      if (menu.open) closeAll(menu);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    group.addEventListener('click', onClick);
    // `toggle` does not bubble; the capture phase still sees it.
    group.addEventListener('toggle', onToggle, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      group.removeEventListener('click', onClick);
      group.removeEventListener('toggle', onToggle, true);
    };
  }, []);

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}

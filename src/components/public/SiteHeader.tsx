import { Link } from '@/i18n/navigation';
import { localized } from '@/lib/i18n';
import type { NavNode } from '@/lib/public/navigation';
import { Container, cn } from '@/components/ui/primitives';
import LocaleSwitcher from './LocaleSwitcher';
import DisclosureGroup from './DisclosureGroup';
import { NavLink, NavSummary } from './NavCurrent';

/**
 * The public header: site name, the `navigation` menu, and the language switcher.
 *
 * Both the desktop submenu and the mobile drawer are `<details>` elements rather
 * than JavaScript-driven popovers. A native disclosure opens on click and on
 * Enter/Space, is announced correctly by screen readers, and — the reason it was
 * chosen — keeps the whole menu usable when JavaScript never arrives, which is
 * a real state on the connections this portal is built for.
 *
 * Hover-to-open was rejected outright: it is unusable on touch, which is how
 * most visitors will arrive.
 *
 * What a bare `<details>` lacks as a menu — closing on an outside click, on
 * Escape, and after a link is chosen; one open at a time — `DisclosureGroup`
 * adds once JavaScript is there. The desktop submenus also share a `name`, so
 * browsers that know the exclusive-accordion attribute get one-at-a-time even
 * before that.
 */
export default function SiteHeader({
  menu,
  drawer,
  siteName,
  locale,
  labels,
}: {
  menu: NavNode[];
  drawer: NavNode[];
  siteName: string;
  locale: string;
  labels: { menu: string; language: string };
}) {
  return (
    // `relative` anchors the drawer to the header's bottom edge; `z-30` keeps
    // the header, and the open drawer inside it, above the page.
    <header className="relative z-30 border-b border-ink-200/70 bg-white">
      <DisclosureGroup>
        <Container className="flex items-center justify-between gap-3 py-3">
          {/*
            The site name comes from `settings` and can be long — the seeded value
            is "Irshad — Guide to Government Services". It must be allowed to
            truncate: pinned at its natural width it pushes the page wider than a
            320 px screen, which is the smallest the portal supports.
          */}
          <Link href="/" className="min-w-0 truncate text-base font-semibold text-ink-900">
            {siteName}
          </Link>

          {/* Desktop: the `menu` placement, inline. */}
          <nav aria-label={labels.menu} className="hidden shrink-0 md:block">
            <ul className="flex items-center gap-1">
              {menu.map((item) => (
                <li key={item.id} className="relative">
                  {item.children.length > 0 ? (
                    <details name="site-menu" className="group">
                      <NavSummary node={item}>
                        {localized(item, 'title', locale)}
                        <Chevron className="transition-transform group-open:rotate-180" />
                      </NavSummary>
                      {/*
                        `w-max` sizes the panel to its longest entry so labels
                        stay on one line; `max-w-xs` is the ceiling for a
                        staff-entered title long enough to need wrapping.
                      */}
                      <ul className="absolute start-0 top-full z-10 mt-1 w-max min-w-48 max-w-xs rounded-md bg-white p-1 shadow-lg ring-1 ring-ink-200">
                        {item.children.map((child) => (
                          <li key={child.id}>
                            <NavLink node={child} locale={locale} block />
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : (
                    <NavLink node={item} locale={locale} />
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <LocaleSwitcher label={labels.language} />

            {/* Mobile: the `drawer` placement, behind a disclosure. */}
            <details className="group md:hidden">
              <summary
                aria-label={labels.menu}
                className={cn(
                  'flex cursor-pointer list-none items-center justify-center rounded-md p-2',
                  'text-ink-700 ring-1 ring-ink-200 marker:content-none hover:bg-ink-50 group-open:bg-ink-100',
                )}
              >
                <MenuIcon className="group-open:hidden" />
                <CloseIcon className="hidden group-open:block" />
              </summary>

              {/*
                The backdrop dims the page so the drawer reads as a layer, not a
                block of text pasted onto the content, and gives a tap target
                for closing it. `data-dismiss` is how `DisclosureGroup` treats
                that tap as "outside". It starts at the header's bottom edge,
                so the bar itself — name, languages, the close button — stays
                bright and usable.
              */}
              <div
                data-dismiss
                aria-hidden="true"
                className="absolute inset-x-0 top-full z-10 h-screen bg-ink-900/40"
              />
              <nav
                aria-label={labels.menu}
                // `inset-x-0` is symmetric, so it needs no logical variant.
                className="absolute inset-x-0 top-full z-10 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-ink-200 bg-white p-2 shadow-lg"
              >
                <ul className="space-y-0.5">
                  {drawer.map((item) => (
                    <li key={item.id}>
                      <NavLink node={item} locale={locale} block />
                      {item.children.length > 0 ? (
                        <ul className="ms-4 space-y-0.5 border-s border-ink-200 ps-2">
                          {item.children.map((child) => (
                            <li key={child.id}>
                              <NavLink node={child} locale={locale} block />
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </nav>
            </details>
          </div>
        </Container>
      </DisclosureGroup>
    </header>
  );
}

/* Inline icons: three glyphs are not worth a dependency, and inline SVG needs
   no extra request on a slow connection. All are decorative — the text or
   `aria-label` beside them carries the meaning. */

function Chevron({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className={cn('size-3.5 text-ink-400', className)}>
      <path
        d="M4 6l4 4 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={cn('size-5', className)}>
      <path
        d="M3 5h14M3 10h14M3 15h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={cn('size-5', className)}>
      <path
        d="M5 5l10 10M15 5L5 15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

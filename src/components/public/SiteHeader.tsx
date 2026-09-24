import { Link } from '@/i18n/navigation';
import { localized } from '@/lib/i18n';
import type { NavNode } from '@/lib/public/navigation';
import { Container, cn } from '@/components/ui/primitives';
import { Icon } from '@/components/public/home/icons';
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
 * before that. Which entry is the current page is marked by the `NavCurrent`
 * leaves, since this header sits in a cached layout and cannot know the URL
 * on the server.
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
  labels: {
    menu: string;
    language: string;
    disclaimer: string;
    help: string;
    account: string;
    signIn: string;
    suggest: string;
  };
}) {
  return (
    // `relative` anchors the drawer to the header's bottom edge; `z-30` keeps
    // the header, and the open drawer inside it, above the page.
    <header className="relative z-30 border-b border-ink-200 bg-white">
      <DisclosureGroup>
      {/* Utility strip: the independence disclaimer belongs on every page,
          above everything, because looking official is this site's biggest
          honesty risk. */}
      <div className="bg-ink-950 text-white/70">
        <Container width="wide" className="flex items-center justify-between gap-3 py-1.5 text-xs">
          <p className="min-w-0 truncate">{labels.disclaimer}</p>
          {/* `min-h-6` is the WCAG 2.2 AA target floor (24px). The negative
              inline margin keeps the widened hit area from shifting the strip's
              own layout. */}
          <Link
            href="/faq"
            className="-mx-1 inline-flex min-h-6 shrink-0 items-center px-1 font-semibold text-white/80 hover:text-white"
          >
            {labels.help}
          </Link>
        </Container>
      </div>
      <Container
        width="wide"
        className="flex flex-wrap items-center justify-between gap-3 py-3 sm:flex-nowrap"
      >
        {/*
          The site name comes from `settings` and can be long — the seeded value
          is "Irshad — Guide to Government Services". It must be allowed to
          truncate: pinned at its natural width it pushes the page wider than a
          320 px screen, which is the smallest the portal supports.

          Below `sm` the brand takes a line of its own. The controls beside it —
          account, three languages, the drawer toggle — need 270 px, which left
          the brand 6 px of a 320 px screen: the name truncated away to nothing
          and the 36 px mark spilled out of its own 6 px link box, over the
          language switcher. None of those controls can be dropped (the drawer
          carries no account link, and the language switcher is the one control
          a reader who cannot read the current language depends on), so the
          header takes a second row instead. It is not sticky, so the extra
          height costs one screenful at the top and nothing after that.

          `sm:flex-nowrap` matters: flex wrapping prefers a new line over
          shrinking an item, so an unqualified `flex-wrap` would also break the
          header in two between 768 px and ~830 px, where truncating the name
          is the better answer.

          `min-w-9` is the floor that keeps the mark intact at any width that
          does not wrap. It cannot be `min-w-0`, and the link cannot fall back
          to its automatic minimum either — the name is `white-space: nowrap`,
          so the link's min-content is the *whole* untruncated name (343 px),
          which would defeat truncation everywhere.
        */}
        <Link href="/" className="flex min-w-9 items-center gap-2.5 text-ink-950">
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center bg-brand-500 text-lg font-extrabold text-white"
          >
            إ
          </span>
          <span className="min-w-0 truncate text-base font-bold">{siteName}</span>
        </Link>

        {/* Desktop: the `menu` placement, inline.
            Shown from `lg`, not `md`: at 768 px the English labels need ~470 px and
            the actions beside them another ~470 px, in a 753 px row. The nav used to
            absorb that by shrinking, and a shrunken flex item plus the global
            `overflow-wrap: anywhere` broke single words in half — "Home" over two
            lines. Below `lg` the drawer already handles this properly. */}
        <nav aria-label={labels.menu} className="hidden shrink-0 lg:block">
          <ul className="flex items-center gap-1">
            {menu.map((item) => (
              <li key={item.id} className="relative">
                {item.children.length > 0 ? (
                  <details name="site-menu" className="group">
                    <NavSummary node={item}>
                      {localized(item, 'title', locale)}
                      <Icon
                        name="chevron"
                        className="size-3.5 text-ink-400 transition-transform group-open:rotate-180"
                        strokeWidth={2}
                      />
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
          {/* All account entries are static links on purpose: reading the
              session here would drag every public page out of static
              rendering. The account pages themselves decide between profile
              and sign-in, so a signed-in visitor clicking "Sign in" simply
              lands on their profile. */}
          <Link
            href="/account/login"
            className="hidden min-h-9 items-center px-2 text-sm font-semibold text-ink-600 transition-colors hover:text-ink-950 md:inline-flex"
          >
            {labels.signIn}
          </Link>
          <Link
            href="/account/submit"
            className="hidden items-center gap-1.5 bg-brand-500 px-3.5 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-600 md:flex"
          >
            <Icon name="plus" className="size-4" strokeWidth={2.4} />
            {labels.suggest}
          </Link>
          <Link
            href="/account"
            aria-label={labels.account}
            title={labels.account}
            // 44px on touch, 36px once there is a mouse pointer driving it.
            className="flex size-11 items-center justify-center border border-ink-200 text-ink-600 transition-colors hover:border-brand-500 hover:text-brand-500 md:size-9"
          >
            <Icon name="user" className="size-4" strokeWidth={2} />
          </Link>
          <LocaleSwitcher label={labels.language} />

          {/* Mobile and tablet: the `drawer` placement, behind a disclosure.
              Hidden from `lg`, matching where the inline nav takes over — at `md`
              the two would both be hidden and the header would have no navigation
              at all between 768 px and 1024 px. */}
          <details className="group lg:hidden">
            {/* Styled as the account button beside it — 44px on touch, 36px
                once a mouse pointer drives it — and turned into a close icon
                while open, so the way out is where the way in was. */}
            <summary
              aria-label={labels.menu}
              title={labels.menu}
              className={cn(
                'flex size-11 cursor-pointer list-none items-center justify-center border border-ink-200 md:size-9',
                'text-ink-600 transition-colors marker:content-none hover:border-brand-500 hover:text-brand-500',
                'group-open:border-brand-500 group-open:text-brand-500',
              )}
            >
              <Icon name="menu" className="size-5 group-open:hidden" strokeWidth={2} />
              <Icon name="close" className="hidden size-5 group-open:block" strokeWidth={2} />
            </summary>

            {/*
              The backdrop dims the page so the drawer reads as a layer, not a
              block of text pasted onto the content, and gives a tap target for
              closing it. `data-dismiss` is how `DisclosureGroup` treats that
              tap as "outside". It starts at the header's bottom edge, so the
              bar itself — name, languages, the close button — stays usable.
            */}
            <div
              data-dismiss
              aria-hidden="true"
              className="absolute inset-x-0 top-full z-10 h-screen bg-ink-900/40"
            />
            <nav
              aria-label={labels.menu}
              // `inset-x-0` is symmetric, so it needs no logical variant.
              className="absolute inset-x-0 top-full z-10 max-h-[70dvh] overflow-y-auto border-b border-ink-200 bg-white p-2 shadow-lg"
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

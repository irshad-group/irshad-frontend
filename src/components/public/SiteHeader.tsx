import { Link } from '@/i18n/navigation';
import { localized } from '@/lib/i18n';
import type { NavNode } from '@/lib/public/navigation';
import { Container, cn } from '@/components/ui/primitives';
import { Icon } from '@/components/public/home/icons';
import LocaleSwitcher from './LocaleSwitcher';

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
    <header className="border-b border-ink-200 bg-white">
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
                  <details className="group">
                    <summary
                      className={cn(
                        // Tighter until xl: at exactly 1024 the English labels and the
                        // actions beside them overshoot the row by a few pixels.
                        'cursor-pointer list-none whitespace-nowrap rounded-md px-2 py-1.5 xl:px-2.5',
                        'text-sm text-ink-600 hover:bg-ink-100 hover:text-ink-900 marker:content-none',
                      )}
                    >
                      {localized(item, 'title', locale)}
                      <span aria-hidden="true" className="ms-1 text-ink-400">
                        ▾
                      </span>
                    </summary>
                    <ul className="absolute z-10 mt-1 min-w-48 rounded-md bg-white p-1 shadow-lg ring-1 ring-ink-200">
                      {item.children.map((child) => (
                        <li key={child.id}>
                          <NavItemLink node={child} locale={locale} />
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <NavItemLink node={item} locale={locale} />
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
          <details className="lg:hidden">
            <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-md px-3 text-sm text-ink-700 ring-1 ring-ink-200 marker:content-none">
              {labels.menu}
            </summary>
            <nav
              aria-label={labels.menu}
              // `inset-x-0` is symmetric, so it needs no logical variant.
              className="absolute inset-x-0 z-10 mt-2 border-y border-ink-200 bg-white p-2 shadow-lg"
            >
              <ul className="space-y-0.5">
                {drawer.map((item) => (
                  <li key={item.id}>
                    <NavItemLink node={item} locale={locale} block />
                    {item.children.length > 0 ? (
                      <ul className="ms-4 space-y-0.5 border-s border-ink-200 ps-2">
                        {item.children.map((child) => (
                          <li key={child.id}>
                            <NavItemLink node={child} locale={locale} block />
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
    </header>
  );
}

function NavItemLink({
  node,
  locale,
  block = false,
}: {
  node: NavNode;
  locale: string;
  block?: boolean;
}) {
  return (
    <Link
      href={node.endpoint || '/'}
      className={cn(
        'rounded-md py-1.5 text-sm text-ink-600 hover:bg-ink-100 hover:text-ink-900',
        // A nav label is a known string, not pasted content. The global
        // `overflow-wrap: anywhere` would otherwise split it mid-word.
        // The drawer keeps the roomier padding — it is a touch target.
        block ? 'block px-2.5' : 'inline-block whitespace-nowrap px-2 xl:px-2.5',
      )}
    >
      {localized(node, 'title', locale)}
    </Link>
  );
}

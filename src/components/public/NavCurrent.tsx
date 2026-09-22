'use client';

import { Suspense, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link, usePathname } from '@/i18n/navigation';
import { localized } from '@/lib/i18n';
import { containsCurrent, isCurrentEntry, type NavNode } from '@/lib/public/navigation';
import { cn } from '@/components/ui/primitives';

/**
 * The two navigation leaves that know which page the visitor is on.
 *
 * The header lives in the public layout, which is rendered once and cached,
 * so it cannot know the current URL on the server. These leaves read it on
 * the client instead and mark the matching entry with `aria-current="page"`.
 *
 * `useSearchParams` forces a static page to bail out to client rendering
 * unless it sits behind a Suspense boundary, so each leaf owns one. The
 * fallback is the same element matched on path alone — `usePathname` needs no
 * boundary — so the prerendered HTML, and a visitor without JavaScript, still
 * get the section highlighted; only the query-scoped entries (`?krg=true`)
 * wait for the client.
 */

const LINK_CLASS = 'rounded-md px-2.5 py-1.5 text-sm transition-colors';
const IDLE_CLASS = 'text-ink-600 hover:bg-ink-100 hover:text-ink-900';
// Weight changes with the colour so the state survives without it.
const CURRENT_CLASS = 'bg-brand-50 font-medium text-brand-700';

function useLocation(): { pathname: string; search: string } {
  return { pathname: usePathname(), search: useSearchParams().toString() };
}

function LinkView({
  node,
  locale,
  block,
  current,
}: {
  node: NavNode;
  locale: string;
  block: boolean;
  current: boolean;
}) {
  return (
    <Link
      href={node.endpoint || '/'}
      aria-current={current ? 'page' : undefined}
      className={cn(
        LINK_CLASS,
        current ? CURRENT_CLASS : IDLE_CLASS,
        // Inline entries never wrap: the site name is what gives way when
        // the bar is tight, not the words in the menu.
        block ? 'block' : 'inline-block whitespace-nowrap',
      )}
    >
      {localized(node, 'title', locale)}
    </Link>
  );
}

function LiveLink(props: { node: NavNode; locale: string; block: boolean }) {
  const { pathname, search } = useLocation();
  return <LinkView {...props} current={isCurrentEntry(props.node.endpoint, pathname, search)} />;
}

function StaticLink(props: { node: NavNode; locale: string; block: boolean }) {
  return <LinkView {...props} current={isCurrentEntry(props.node.endpoint, usePathname(), '')} />;
}

export function NavLink({
  node,
  locale,
  block = false,
}: {
  node: NavNode;
  locale: string;
  block?: boolean;
}) {
  return (
    <Suspense fallback={<StaticLink node={node} locale={locale} block={block} />}>
      <LiveLink node={node} locale={locale} block={block} />
    </Suspense>
  );
}

function SummaryView({ current, children }: { current: boolean; children: ReactNode }) {
  return (
    <summary
      aria-current={current ? 'page' : undefined}
      className={cn(
        'flex cursor-pointer list-none items-center gap-1 whitespace-nowrap marker:content-none',
        LINK_CLASS,
        current ? CURRENT_CLASS : IDLE_CLASS,
      )}
    >
      {children}
    </summary>
  );
}

function LiveSummary({ node, children }: { node: NavNode; children: ReactNode }) {
  const { pathname, search } = useLocation();
  return <SummaryView current={containsCurrent(node, pathname, search)}>{children}</SummaryView>;
}

function StaticSummary({ node, children }: { node: NavNode; children: ReactNode }) {
  return <SummaryView current={containsCurrent(node, usePathname(), '')}>{children}</SummaryView>;
}

/**
 * The trigger of a desktop submenu. It is lit when the entry itself *or any of
 * its children* is current, so the section stays visible while the submenu
 * that holds the exact link is closed.
 */
export function NavSummary({ node, children }: { node: NavNode; children: ReactNode }) {
  return (
    <Suspense fallback={<StaticSummary node={node}>{children}</StaticSummary>}>
      <LiveSummary node={node}>{children}</LiveSummary>
    </Suspense>
  );
}

import NotFoundView from '@/components/public/NotFoundView';

/**
 * 404 for a page inside the public portal that called `notFound()` — a
 * procedure, ministry or directorate that is missing or unpublished.
 *
 * This one sits inside `(public)/layout.tsx`, so it keeps the header, the menu
 * and the footer. That matters: the most common 404 on this site is a citizen
 * following a stale link to a withdrawn procedure, and they should land
 * somewhere they can still navigate from.
 */
export default function PublicNotFound() {
  return <NotFoundView />;
}

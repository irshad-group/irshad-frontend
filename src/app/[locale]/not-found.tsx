import NotFoundView from '@/components/public/NotFoundView';

/**
 * 404 for an unmatched URL inside a locale.
 *
 * Renders without the site header and footer, because an unmatched path never
 * enters the `(public)` route group and so its layout is not in the tree. The
 * links in the view are therefore the only way out, which is why they are real
 * destinations rather than a single "go back".
 */
export default function LocaleNotFound() {
  return <NotFoundView />;
}

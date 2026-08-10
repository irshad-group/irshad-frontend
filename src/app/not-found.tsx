/**
 * 404 for anything outside a locale segment.
 *
 * The proxy sends almost everything to `/{locale}/…`, so this is reached only
 * by requests that never got that far — a malformed path, or a `notFound()`
 * raised by the locale layout when the first segment is not a real locale.
 * The locale is unknown by definition, so this offers all three rather than
 * guessing, and each link is a genuine way back in.
 */
export default function RootNotFound() {
  const entries = [
    { locale: 'en', dir: 'ltr' as const, label: 'English', text: 'This page could not be found.' },
    { locale: 'ar', dir: 'rtl' as const, label: 'العربية', text: 'تعذر العثور على هذه الصفحة.' },
    { locale: 'ku', dir: 'rtl' as const, label: 'کوردی', text: 'ئەم پەڕەیە نەدۆزرایەوە.' },
  ];

  return (
    <div className="mx-auto max-w-lg px-6 py-20">
      <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">404</p>
      <ul className="mt-6 space-y-6">
        {entries.map((entry) => (
          <li key={entry.locale} lang={entry.locale} dir={entry.dir}>
            <p className="text-ink-700">{entry.text}</p>
            <a
              href={`/${entry.locale}`}
              className="mt-1 inline-block text-sm text-brand-700 underline"
            >
              {entry.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

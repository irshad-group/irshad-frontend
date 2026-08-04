import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import LocaleSwitcher from '@/components/public/LocaleSwitcher';

/**
 * Minimal public shell — just enough to host the language switcher.
 *
 * The real header (navigation-driven menu, footer, settings-driven contact
 * details) is a separate piece of work waiting on the design; this is the mount
 * point it will grow into, not the finished article.
 */
export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-ink-200/70 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <Link href="/" className="text-sm font-semibold text-ink-900">
            {t('site.name')}
          </Link>
          <LocaleSwitcher label={t('site.language')} />
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}

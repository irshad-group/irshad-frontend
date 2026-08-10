import { getTranslations, setRequestLocale } from 'next-intl/server';
import { listAllPublic } from '@/lib/pb/queries/public';
import { buildNavTree } from '@/lib/public/navigation';
import { settingsMap, settingValue } from '@/lib/public/settings';
import SiteHeader from '@/components/public/SiteHeader';
import SiteFooter from '@/components/public/SiteFooter';

/**
 * The public shell.
 *
 * The menu and footer come from the `navigation` and `settings` collections, so
 * staff change them in the admin without a deployment. Both reads go through
 * the anonymous public client — using `pbServer()` here would call `cookies()`
 * and drag every page in the group out of static rendering.
 */
// Must be a literal: Next reads segment config by static analysis at build time,
// so an imported constant fails with "Invalid segment configuration export".
// Keep in step with PUBLIC_REVALIDATE in lib/pb/queries/public.ts.
export const revalidate = 3600;

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

  const [navigation, settingsRecords] = await Promise.all([
    listAllPublic('navigation', { sort: 'sort_order' }),
    listAllPublic('settings'),
  ]);

  const settings = settingsMap(settingsRecords);
  // Staff can empty `site_name`; the app's own name is the last resort.
  const siteName = settingValue(settings, 'site_name', locale) || t('site.name');

  return (
    <div className="flex min-h-screen flex-col">
      {/* First tab stop on every page: jump past the menu straight to content. */}
      <a href="#main" className="skip-link">
        {t('site.skipToContent')}
      </a>

      <SiteHeader
        menu={buildNavTree(navigation, 'menu')}
        drawer={buildNavTree(navigation, 'drawer')}
        siteName={siteName}
        locale={locale}
        labels={{ menu: t('site.menu'), language: t('site.language') }}
      />

      <main id="main" className="flex-1">
        {children}
      </main>

      <SiteFooter
        settings={settings}
        locale={locale}
        labels={{ contact: t('site.contact'), follow: t('site.follow') }}
      />
    </div>
  );
}

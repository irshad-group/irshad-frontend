import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { collectionGroups, collections } from '@/lib/admin/registry';
import type { SessionUser } from '@/lib/auth';
import { isAdmin } from '@/lib/auth';
import NavLink from './NavLink';
import SignOutButton from './SignOutButton';

export default async function Sidebar({ user, locale }: { user: SessionUser; locale: string }) {
  const t = await getTranslations('admin');
  const admin = isAdmin(user);

  // Sections the signed-in role cannot open are hidden. This is presentation
  // only — the API rules are what actually stop a moderator writing to them.
  const visible = collections.filter((c) => !c.adminOnly || admin);

  return (
    <aside className="flex w-60 shrink-0 flex-col border-e border-ink-200 bg-white">
      <div className="border-b border-ink-200 px-4 py-4">
        <Link href="/admin" className="block">
          <span className="block text-sm font-semibold text-ink-900">{t('title')}</span>
          <span className="mt-0.5 block text-xs text-ink-500">
            {admin ? t('roleAdmin') : t('roleModerator')}
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label={t('quickLinks')}>
        <NavLink href="/admin" label={t('dashboard')} exact />

        {collectionGroups.map((group) => {
          const items = visible.filter((c) => c.group === group);
          if (!items.length) return null;
          return (
            <div key={group} className="mt-4">
              <h2 className="px-2.5 pb-1 text-xs font-semibold tracking-wide text-ink-400 uppercase">
                {t(`groups.${group}`)}
              </h2>
              <ul>
                {items.map((c) => (
                  <li key={c.name}>
                    <NavLink href={`/admin/${c.name}`} label={c.labelPlural} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-ink-200 px-4 py-3">
        <p className="truncate text-sm font-medium text-ink-800">{user.full_name}</p>
        <p className="truncate text-xs text-ink-500">{user.email}</p>
        <div className="mt-2">
          <SignOutButton locale={locale} label={t('signOut')} />
        </div>
      </div>
    </aside>
  );
}

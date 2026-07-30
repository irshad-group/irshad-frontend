import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import Sidebar from '@/components/admin/Sidebar';
import { getSessionUser, isStaff } from '@/lib/auth';

/**
 * The real admin guard.
 *
 * `proxy.ts` only checks that an auth cookie exists — it cannot verify the
 * token or read the user's role at the edge. This layout resolves the session
 * against PocketBase and returns 404 (not 403) for anyone who is not staff, so
 * the admin surface is not enumerable by a signed-in citizen.
 *
 * The login page lives in a sibling route group so it is not guarded by this.
 */
export default async function GuardedAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getSessionUser();
  if (!isStaff(user) || !user) notFound();

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} locale={locale} />
      <main className="min-w-0 flex-1 px-6 py-6 lg:px-8">{children}</main>
    </div>
  );
}

import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import LoginForm from '@/components/admin/LoginForm';
import { Card } from '@/components/ui/primitives';
import { signIn } from '@/lib/admin/actions';
import { getSessionUser, isStaff } from '@/lib/auth';

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  const { next } = await searchParams;
  setRequestLocale(locale);

  // Already signed in as staff — no reason to show the form again.
  const user = await getSessionUser();
  if (isStaff(user)) redirect(`/${locale}/admin`);

  const t = await getTranslations();
  const action = signIn.bind(null, locale);

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">
            {t('site.name')}
          </p>
          <h1 className="mt-2 text-lg font-semibold text-ink-900">{t('admin.signInTitle')}</h1>
          <p className="mt-1 text-sm text-ink-500">{t('admin.signInIntro')}</p>
        </div>

        <Card className="p-6">
          <LoginForm
            action={action}
            next={next ?? ''}
            labels={{
              email: t('admin.email'),
              password: t('admin.password'),
              signIn: t('admin.signIn'),
              saving: t('common.loading'),
            }}
          />
        </Card>
      </div>
    </main>
  );
}

import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getSessionUser } from '@/lib/auth';
import { Container } from '@/components/ui/primitives';
import { OtpLoginForm, PasswordLoginForm, type AuthLabels } from '@/components/public/account/AuthForms';

/**
 * Citizen sign-in: password, or a one-time code by email. Reads the session
 * cookie, so this route is dynamic — which is right for an account page and
 * costs the static budget nothing.
 */
export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('account');

  if (await getSessionUser()) redirect(`/${locale}/account`);

  const labels: AuthLabels = {
    email: t('email'),
    password: t('password'),
    passwordConfirm: t('passwordConfirm'),
    fullName: t('fullName'),
    signInBtn: t('signInBtn'),
    registerBtn: t('registerBtn'),
    otpHeading: t('otpHeading'),
    otpIntro: t('otpIntro'),
    otpRequest: t('otpRequest'),
    otpCodeLabel: t('otpCodeLabel'),
    otpVerify: t('otpVerify'),
    otpSentTo: t('otpSentTo', { email: '{email}' }),
    otpBack: t('otpBack'),
    errors: t.raw('errors') as Record<string, string>,
  };

  return (
    <Container width="narrow" className="py-12">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink-950">{t('signInTitle')}</h1>

      <div className="mt-6 border border-ink-200 bg-white p-6">
        <PasswordLoginForm labels={labels} />
      </div>

      <div className="mt-4 border border-ink-200 bg-white p-6">
        <h2 className="mb-3 text-base font-extrabold text-ink-950">{t('otpHeading')}</h2>
        <OtpLoginForm labels={labels} />
      </div>

      <p className="mt-6 text-center text-sm">
        <Link href="/account/register" className="font-bold text-brand-500 hover:text-brand-600">
          {t('needAccount')}
        </Link>
      </p>
    </Container>
  );
}

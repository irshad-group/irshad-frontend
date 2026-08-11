import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getSessionUser } from '@/lib/auth';
import { Container } from '@/components/ui/primitives';
import { RegisterForm, type AuthLabels } from '@/components/public/account/AuthForms';

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
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
      <h1 className="text-2xl font-extrabold tracking-tight text-ink-950">{t('registerTitle')}</h1>

      <div className="mt-6 border border-ink-200 bg-white p-6">
        <RegisterForm labels={labels} />
      </div>

      <p className="mt-6 text-center text-sm">
        <Link href="/account/login" className="font-bold text-brand-500 hover:text-brand-600">
          {t('haveAccount')}
        </Link>
      </p>
    </Container>
  );
}

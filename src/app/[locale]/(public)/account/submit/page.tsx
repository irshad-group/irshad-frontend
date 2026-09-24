import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getSessionUser } from '@/lib/auth';
import { localized } from '@/lib/i18n';
import { listAllPublic } from '@/lib/pb/queries/public';
import { Container } from '@/components/ui/primitives';
import SubmissionWizard, {
  type WizardLabels,
  type WizardOption,
} from '@/components/public/account/SubmissionWizard';

/**
 * The suggestion wizard. Ministries and directorates are offered as picks
 * from the anonymous public read — the same lists any visitor sees — because
 * citizens choose among existing bodies; only reviewers create new ones.
 */
export default async function SubmitPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('account');
  const tCommon = await getTranslations('common');

  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/account/login`);

  const [ministries, directorates] = await Promise.all([
    listAllPublic('ministries', { sort: 'sort_order' }),
    listAllPublic('directorates', { sort: 'sort_order' }),
  ]);

  const ministryOptions: WizardOption[] = ministries.map((ministry) => ({
    id: ministry.id,
    label: localized(ministry, 'title', locale),
  }));
  const directorateOptions: WizardOption[] = directorates.map((directorate) => ({
    id: directorate.id,
    label: localized(directorate, 'title', locale),
    ministry: directorate.ministry,
  }));

  const labels: WizardLabels = {
    stepLabel: t('stepLabel', { n: '{n}', total: '{total}' }),
    stepTitles: [t('step1Title'), t('step2Title'), t('step3Title')],
    titleLabel: t('titleLabel'),
    titleHint: t('titleHint'),
    summaryLabel: t('summaryLabel'),
    ministryLabel: t('ministryLabel'),
    ministryHint: t('ministryHint'),
    directorateLabel: t('directorateLabel'),
    directorateHint: t('directorateHint'),
    stepsLabel: t('stepsLabel'),
    stepsHint: t('stepsHint'),
    documentsLabel: t('documentsLabel'),
    documentsHint: t('documentsHint'),
    feeLabel: t('feeLabel'),
    feeHint: t('feeHint'),
    timeLabel: t('timeLabel'),
    timeHint: t('timeHint'),
    notesLabel: t('notesLabel'),
    next: t('next'),
    back: t('back'),
    send: t('send'),
    none: tCommon('none'),
    errors: t.raw('errors') as Record<string, string>,
  };

  return (
    <Container className="py-12">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink-950">{t('submitTitle')}</h1>
      <p className="mt-2 max-w-[var(--measure-prose)] text-sm text-ink-600">{t('wizardIntro')}</p>
      <div className="mt-8 max-w-3xl border border-ink-200 bg-white p-6 sm:p-8">
        <SubmissionWizard
          ministries={ministryOptions}
          directorates={directorateOptions}
          labels={labels}
        />
      </div>
    </Container>
  );
}

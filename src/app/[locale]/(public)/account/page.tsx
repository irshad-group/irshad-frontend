import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getSessionUser } from '@/lib/auth';
import { pbServer } from '@/lib/pb/server';
import { localized } from '@/lib/i18n';
import { Container, EmptyState, cn } from '@/components/ui/primitives';
import { Icon } from '@/components/public/home/icons';
import type { MinistriesRecord, ProcedureSubmissionsRecord } from '@/types/pb';
import { deleteSubmission, signOut } from './actions';

const STATUS_STYLE: Record<string, string> = {
  submitted: 'bg-ink-100 text-ink-700',
  in_review: 'bg-gold-100 text-gold-800',
  approved: 'bg-brand-100 text-brand-700',
  rejected: 'bg-red-50 text-red-800',
};

/**
 * The citizen profile: who is signed in, and every procedure they have
 * suggested with its review status. The list comes back already scoped to the
 * requesting user by the collection's list rule — no filter to get wrong here.
 */
export default async function AccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('account');

  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/account/login`);

  const pb = await pbServer();
  const submissions = await pb
    .collection('procedure_submissions')
    .getList(1, 50, { sort: '-created', expand: 'ministry,directorate' });
  const items = submissions.items as unknown as ProcedureSubmissionsRecord[];

  const { submitted } = await searchParams;
  const statusLabel: Record<string, string> = {
    submitted: t('statusSubmitted'),
    in_review: t('statusInReview'),
    approved: t('statusApproved'),
    rejected: t('statusRejected'),
  };

  return (
    <Container className="py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center bg-brand-500 text-white">
            <Icon name="users" className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-ink-950">{t('title')}</h1>
            <p className="text-sm text-ink-500">
              {t('profileWelcome', { name: user.full_name || user.email })}
            </p>
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="border border-ink-300 px-4 py-2 text-sm font-bold text-ink-700 transition-colors hover:border-ink-950"
          >
            {t('signOutBtn')}
          </button>
        </form>
      </div>

      {submitted ? (
        <p role="status" className="mt-6 border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700">
          {t('submittedOk')}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold text-ink-950">{t('mySubmissions')}</h2>
        <Link
          href="/account/submit"
          className="bg-brand-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-600"
        >
          {t('newSubmission')}
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="mt-4">
          <EmptyState title={t('noSubmissions')} />
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((submission) => {
            const ministry = submission.expand?.ministry as MinistriesRecord | undefined;
            return (
              <li key={submission.id} className="border border-ink-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-ink-950">{submission.title}</p>
                    <p className="mt-1 text-xs text-ink-500">
                      {ministry ? `${localized(ministry, 'title', locale)} · ` : ''}
                      <span dir="ltr">{submission.created.slice(0, 10)}</span>
                    </p>
                  </div>
                  <span
                    className={cn(
                      'px-2 py-0.5 text-xs font-extrabold',
                      STATUS_STYLE[submission.status] ?? STATUS_STYLE.submitted,
                    )}
                  >
                    {statusLabel[submission.status] ?? submission.status}
                  </span>
                </div>
                {submission.status === 'rejected' && submission.review_note ? (
                  <p className="mt-3 border-s-2 border-red-200 ps-3 text-sm text-ink-600">
                    <span className="font-semibold">{t('reviewNote')}: </span>
                    {submission.review_note}
                  </p>
                ) : null}
                {submission.status === 'submitted' ? (
                  <form action={deleteSubmission} className="mt-3">
                    <input type="hidden" name="id" value={submission.id} />
                    <button
                      type="submit"
                      className="text-xs font-bold text-red-700 hover:text-red-800"
                    >
                      {t('deleteDraft')}
                    </button>
                  </form>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}

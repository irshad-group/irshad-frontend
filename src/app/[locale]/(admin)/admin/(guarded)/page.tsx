import { getTranslations, setRequestLocale } from 'next-intl/server';
import ModerationActions from '@/components/admin/ModerationActions';
import { Badge, Card, PageHeader } from '@/components/ui/primitives';
import { Link } from '@/i18n/navigation';
import { setApproval } from '@/lib/admin/actions';
import { getSessionUser } from '@/lib/auth';
import { countRecords, listRecords } from '@/lib/pb/collections';

type Pending = Record<string, unknown> & { id: string; expand?: Record<string, unknown> };

function authorName(row: Pending): string {
  const author = row.expand?.author;
  if (author && typeof author === 'object') {
    return String((author as Record<string, unknown>).full_name ?? '');
  }
  return '';
}

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="block rounded-lg bg-white p-4 ring-1 ring-ink-200/70 transition-shadow hover:ring-brand-300"
    >
      <p className="text-sm text-ink-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink-900 tabular-nums">{value}</p>
    </Link>
  );
}

export default async function AdminDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('admin');
  const tCommon = await getTranslations('common');
  const user = await getSessionUser();

  const [pendingComments, pendingReviews, newMessages, publishedProcedures] = await Promise.all([
    countRecords('comments', 'approved = false'),
    countRecords('reviews', 'approved = false'),
    countRecords('contact', 'status = "new"'),
    countRecords('procedures', 'enabled = true && archived = false'),
  ]);

  const [comments, reviews] = await Promise.all([
    listRecords('comments', {
      perPage: 5,
      filter: 'approved = false',
      sort: '-created',
      expand: 'author,procedure',
    }),
    listRecords('reviews', {
      perPage: 5,
      filter: 'approved = false',
      sort: '-created',
      expand: 'author,procedure',
    }),
  ]);

  const queues = [
    { key: 'comments' as const, title: t('pendingComments'), rows: comments.items as unknown as Pending[] },
    { key: 'reviews' as const, title: t('pendingReviews'), rows: reviews.items as unknown as Pending[] },
  ];

  return (
    <>
      <PageHeader
        title={t('dashboard')}
        description={user ? t('welcome', { name: user.full_name }) : undefined}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t('pendingComments')} value={pendingComments} href="/admin/comments" />
        <Stat label={t('pendingReviews')} value={pendingReviews} href="/admin/reviews" />
        <Stat label={t('newMessages')} value={newMessages} href="/admin/contact" />
        <Stat label={t('totalProcedures')} value={publishedProcedures} href="/admin/procedures" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        {queues.map((queue) => (
          <section key={queue.key}>
            <h2 className="mb-2 text-sm font-semibold text-ink-700">{queue.title}</h2>
            <Card>
              {queue.rows.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-ink-500">
                  {tCommon('noResults')}
                </p>
              ) : (
                <ul className="divide-y divide-ink-100">
                  {queue.rows.map((row) => (
                    <li key={row.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {queue.key === 'reviews' ? (
                            <Badge tone="neutral">{String(row.rating ?? '')} / 5</Badge>
                          ) : null}
                          <p className="mt-1 line-clamp-2 text-sm text-ink-800">
                            {String(row.body ?? '')}
                          </p>
                          <p className="mt-1 text-xs text-ink-500">{authorName(row)}</p>
                        </div>
                        <ModerationActions
                          approve={setApproval.bind(null, locale, queue.key, row.id, true)}
                          labels={{ approve: t('approve') }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>
        ))}
      </div>
    </>
  );
}

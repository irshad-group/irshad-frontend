import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import RecordEditor from '@/components/admin/RecordEditor';
import { getCollectionDef } from '@/lib/admin/registry';
import { getSessionUser, isAdmin } from '@/lib/auth';

export default async function NewRecordPage({
  params,
}: {
  params: Promise<{ locale: string; collection: string }>;
}) {
  const { locale, collection } = await params;
  setRequestLocale(locale);

  const def = getCollectionDef(collection);
  if (!def?.canCreate) notFound();

  const user = await getSessionUser();
  if (def.adminOnly && !isAdmin(user)) notFound();

  return <RecordEditor def={def} record={null} locale={locale} canDelete={false} />;
}

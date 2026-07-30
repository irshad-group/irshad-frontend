import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import RecordEditor from '@/components/admin/RecordEditor';
import { getCollectionDef } from '@/lib/admin/registry';
import { getSessionUser, isAdmin } from '@/lib/auth';
import { getRecord } from '@/lib/pb/collections';

export default async function EditRecordPage({
  params,
}: {
  params: Promise<{ locale: string; collection: string; id: string }>;
}) {
  const { locale, collection, id } = await params;
  setRequestLocale(locale);

  const def = getCollectionDef(collection);
  if (!def) notFound();

  const user = await getSessionUser();
  if (def.adminOnly && !isAdmin(user)) notFound();

  // `getRecord` returns null both for a missing record and for one an API rule
  // hides from this user. Treating them alike is deliberate.
  const record = await getRecord(def.name, id, { expand: def.expand });
  if (!record) notFound();

  return (
    <RecordEditor
      def={def}
      record={record as unknown as Record<string, unknown> & { id: string }}
      locale={locale}
      canDelete={!!def.canDelete}
    />
  );
}

import { getTranslations } from 'next-intl/server';
import EntityForm, { type FormFieldDef } from './EntityForm';
import DeleteButton from './DeleteButton';
import { Card, PageHeader, buttonClass } from '@/components/ui/primitives';
import { Link } from '@/i18n/navigation';
import { deleteRecord, saveRecord } from '@/lib/admin/actions';
import { relationOptions, type RelationOption } from '@/lib/admin/data';
import { getCollectionDef, storedFieldNames, type CollectionDef } from '@/lib/admin/registry';
import { localized } from '@/lib/i18n';

/** The field a relation picker shows for the target collection. */
function displayFieldFor(collection: string): string {
  const target = getCollectionDef(collection);
  if (!target) return 'id';
  return target.titleTranslatable ? `${target.titleField}_en` : target.titleField;
}

export default async function RecordEditor({
  def,
  record,
  locale,
  canDelete,
}: {
  def: CollectionDef;
  record: (Record<string, unknown> & { id: string }) | null;
  locale: string;
  canDelete: boolean;
}) {
  const t = await getTranslations('common');
  const tAdmin = await getTranslations('admin');

  // Relation pickers are loaded in parallel — a procedure form otherwise waits
  // on directorates and tags in series.
  const relationFields = def.fields.filter((f) => f.kind === 'relation' && f.relation);
  const loaded = await Promise.all(
    relationFields.map(async (field) => {
      const target = field.relation!.collection;
      const options = await relationOptions(target, displayFieldFor(target));
      return [field.name, options] as const;
    }),
  );
  const optionsByField: Record<string, RelationOption[]> = Object.fromEntries(loaded);

  const values: Record<string, unknown> = {};
  const fileValues: Record<string, string> = {};

  for (const field of def.fields) {
    if (field.kind === 'file') {
      const current = record?.[field.name];
      fileValues[field.name] = Array.isArray(current)
        ? current.join(', ')
        : typeof current === 'string'
          ? current
          : '';
      continue;
    }
    for (const stored of storedFieldNames(field)) {
      const current = record?.[stored];
      // JSON fields hold a parsed value; the textarea needs it back as text.
      values[stored] =
        field.kind === 'json'
          ? current == null
            ? ''
            : JSON.stringify(current, null, 2)
          : (current ?? (field.relation?.multiple ? [] : ''));
    }
  }

  const formFields: FormFieldDef[] = def.fields.map((field) => ({
    ...field,
    storedNames: storedFieldNames(field),
  }));

  const heading = record
    ? def.titleTranslatable
      ? localized(record, def.titleField, locale) || tAdmin('editRecord', { label: def.label })
      : String(record[def.titleField] ?? tAdmin('editRecord', { label: def.label }))
    : tAdmin('newRecord', { label: def.label.toLowerCase() });

  const save = saveRecord.bind(null, locale, def.name, record?.id ?? null);
  const listHref = `/${locale}/admin/${def.name}`;

  return (
    <>
      <PageHeader
        title={heading}
        description={record ? undefined : def.description}
        actions={
          <Link href={`/admin/${def.name}`} className={buttonClass('secondary')}>
            {t('back')}
          </Link>
        }
      />

      <Card className="p-6">
        <EntityForm
          action={save}
          fields={formFields}
          values={values}
          relationOptions={optionsByField}
          fileValues={fileValues}
          cancelHref={listHref}
          labels={{
            save: t('save'),
            saving: t('saving'),
            cancel: t('cancel'),
            currentFile: t('currentFile'),
            clearFile: t('clearFile'),
            hint: tAdmin('unsavedHint'),
          }}
        />
      </Card>

      {record && canDelete ? (
        <div className="mt-6 border-t border-ink-200 pt-6">
          <DeleteButton
            action={deleteRecord.bind(null, locale, def.name, record.id)}
            labels={{ delete: t('delete'), confirm: tAdmin('deleteConfirm') }}
          />
        </div>
      ) : null}
    </>
  );
}

import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Badge, BoolMark } from '@/components/ui/primitives';
import type { ColumnDef, CollectionDef } from '@/lib/admin/registry';
import { PB_URL } from '@/lib/pb/server';
import { localized, translationStatus } from '@/lib/i18n';

type Row = Record<string, unknown> & {
  id: string;
  collectionId?: string;
  expand?: Record<string, unknown>;
};

function ImageCell({ row, column }: { row: Row; column: ColumnDef }) {
  const raw = row[column.name];
  const filename = Array.isArray(raw) ? raw[0] : raw;
  if (typeof filename !== 'string' || !filename || !row.collectionId) {
    return <span aria-hidden="true" className="block size-8 border border-ink-200 bg-ink-50" />;
  }
  const src = `${PB_URL}/api/files/${row.collectionId}/${row.id}/${encodeURIComponent(filename)}${
    column.thumb ? `?thumb=${encodeURIComponent(column.thumb)}` : ''
  }`;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- PocketBase thumb at a fixed 32px; next/image would proxy it for nothing.
    <img src={src} alt="" className="size-8 border border-ink-200 bg-white object-contain" />
  );
}

function relationLabel(row: Row, column: ColumnDef): string {
  const expanded = row.expand?.[column.name];
  const field = column.relationLabel ?? 'id';
  const read = (item: unknown) =>
    typeof item === 'object' && item !== null
      ? String((item as Record<string, unknown>)[field] ?? '')
      : '';

  if (Array.isArray(expanded)) return expanded.map(read).filter(Boolean).join(', ');
  if (expanded) return read(expanded);

  // Not expanded (or hidden from this role by an API rule) — show nothing
  // rather than a raw 15-character id, which means nothing to an editor.
  return '';
}

function formatDate(value: unknown): string {
  if (typeof value !== 'string' || !value) return '';
  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

async function TranslationCell({ row, fields }: { row: Row; fields: readonly string[] }) {
  const t = await getTranslations('admin');
  const status = translationStatus(row, fields);
  const missing = (['en', 'ar', 'ku'] as const).filter((l) => !status[l]);

  if (!missing.length) {
    return <Badge tone="good">{t('translationsComplete')}</Badge>;
  }
  return (
    <Badge tone="warn">
      {t('translationsMissing', { locales: missing.map((l) => l.toUpperCase()).join(', ') })}
    </Badge>
  );
}

async function Cell({ row, column, locale }: { row: Row; column: ColumnDef; locale: string }) {
  switch (column.kind) {
    case 'image':
      return <ImageCell row={row} column={column} />;
    case 'bool':
      return <BoolMark value={row[column.name]} />;
    case 'badge': {
      const value = row[column.name];
      return value ? <Badge>{String(value).replace(/_/g, ' ')}</Badge> : null;
    }
    case 'relation':
      return <span className="text-ink-600">{relationLabel(row, column)}</span>;
    case 'date':
      return <span className="tabular text-ink-500">{formatDate(row[column.name])}</span>;
    case 'number':
      return <span className="tabular text-ink-600">{String(row[column.name] ?? '')}</span>;
    case 'translations':
      return <TranslationCell row={row} fields={column.fields ?? []} />;
    default: {
      const value = column.translatable
        ? localized(row, column.name, locale)
        : String(row[column.name] ?? '');
      return <span className="text-ink-800">{value}</span>;
    }
  }
}

export default async function DataTable({
  def,
  rows,
  locale,
}: {
  def: CollectionDef;
  rows: Row[];
  locale: string;
}) {
  const t = await getTranslations('common');

  if (!rows.length) {
    return <p className="px-4 py-10 text-center text-sm text-ink-500">{t('noResults')}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-start text-sm">
        <thead>
          <tr className="border-b border-ink-200 text-xs tracking-wide text-ink-500 uppercase">
            {def.listColumns.map((column) => (
              <th key={column.name} scope="col" className="px-4 py-2.5 text-start font-medium">
                {column.label}
              </th>
            ))}
            <th scope="col" className="px-4 py-2.5 text-end font-medium">
              {t('actions')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-ink-50/60">
              {def.listColumns.map((column) => (
                <td key={column.name} className="max-w-xs truncate px-4 py-2.5 align-middle">
                  <Cell row={row} column={column} locale={locale} />
                </td>
              ))}
              <td className="px-4 py-2.5 text-end whitespace-nowrap">
                <Link
                  href={`/admin/${def.name}/${row.id}`}
                  className="font-medium text-brand-600 hover:text-brand-700"
                >
                  {t('edit')}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

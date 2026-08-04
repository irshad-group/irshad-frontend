import { localized } from '@/lib/i18n';
import { attachedFile } from '@/lib/public/procedures';
import { fileUrl } from '@/lib/pb/queries/public';
import type { FilesRecord } from '@/types/pb';

/**
 * Downloadable forms attached to a procedure or one of its steps.
 *
 * Anything that resolves to neither an upload nor a link is skipped rather than
 * rendered as a dead row — the schema permits both fields to be empty, and a
 * link to nowhere is worse than an absent one.
 *
 * The whole list can legitimately be empty, and the API rules also withdraw
 * attachments when the parent procedure is unpublished, so the caller decides
 * what an empty list looks like.
 */
export default function FileList({
  files,
  locale,
  labels,
}: {
  files: FilesRecord[];
  locale: string;
  labels: { download: string; opens: string };
}) {
  const rows = files
    .map((file) => ({ file, resolved: attachedFile(file, fileUrl(file, file.document)) }))
    .filter((row): row is { file: FilesRecord; resolved: NonNullable<typeof row.resolved> } =>
      row.resolved !== null,
    );

  if (rows.length === 0) return null;

  return (
    <ul className="space-y-2">
      {rows.map(({ file, resolved }) => (
        <li key={file.id}>
          <a
            href={resolved.href}
            {...(resolved.kind === 'download'
              ? { download: '' }
              : { target: '_blank', rel: 'noopener noreferrer' })}
            className="flex items-center justify-between gap-3 rounded-md bg-white px-4 py-3 text-sm ring-1 ring-ink-200/70 hover:ring-brand-500"
          >
            <span className="min-w-0 truncate font-medium text-ink-800">
              {localized(file, 'title', locale)}
            </span>
            <span className="shrink-0 text-xs text-ink-500">
              {resolved.extension ? `${resolved.extension} · ` : ''}
              {resolved.kind === 'download' ? labels.download : labels.opens}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

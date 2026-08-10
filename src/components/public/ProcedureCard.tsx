import { Link } from '@/i18n/navigation';
import { localized } from '@/lib/i18n';
import { formatFee } from '@/lib/public/procedures';
import type { ProceduresRecord, TagsRecord } from '@/types/pb';

/**
 * One procedure in a list.
 *
 * The whole card is a single link rather than a card with a link inside it: a
 * touch target the size of the card is easier to hit on a phone, and it gives
 * screen readers one clear destination instead of several competing ones.
 *
 * Fee and processing time are the two facts a citizen scans for before opening
 * anything, so they sit on the card and not only on the detail page.
 */
export default function ProcedureCard({
  procedure,
  locale,
  labels,
}: {
  procedure: ProceduresRecord & { expand?: { tags?: TagsRecord[] } };
  locale: string;
  labels: { free: string; fee: string; time: string };
}) {
  const fee = formatFee(procedure.fee_iqd, locale);
  const time = localized(procedure, 'processing_time', locale);
  const tags = procedure.expand?.tags ?? [];

  return (
    <li>
      <Link
        href={`/procedures/${procedure.slug}`}
        className="block h-full rounded-lg bg-white p-5 ring-1 ring-ink-200/70 transition-colors hover:ring-brand-500"
      >
        <h3 className="text-base font-semibold text-ink-900">
          {localized(procedure, 'title', locale)}
        </h3>

        <p className="mt-1.5 line-clamp-3 text-sm text-ink-600">
          {localized(procedure, 'summary', locale)}
        </p>

        <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <div className="flex gap-1.5">
            <dt className="text-ink-500">{labels.fee}</dt>
            <dd className="font-medium text-ink-800">
              {/* No fee recorded and genuinely free are the same in the schema;
                  both read better as "free" than as a missing row. */}
              {fee ? `${fee} IQD` : labels.free}
            </dd>
          </div>
          {time ? (
            <div className="flex gap-1.5">
              <dt className="text-ink-500">{labels.time}</dt>
              <dd className="font-medium text-ink-800">{time}</dd>
            </div>
          ) : null}
        </dl>

        {tags.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <li
                key={tag.id}
                className="rounded bg-ink-100 px-1.5 py-0.5 text-xs font-medium text-ink-700"
              >
                {/* `tags` uses `name_*`, not `title_*`. */}
                {localized(tag, 'name', locale)}
              </li>
            ))}
          </ul>
        ) : null}
      </Link>
    </li>
  );
}

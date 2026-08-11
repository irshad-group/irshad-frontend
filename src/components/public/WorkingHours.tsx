import { getTranslations } from 'next-intl/server';
import { cn } from '@/components/ui/primitives';
import { groupSchedule, parseWorkingHours, type ScheduleGroup } from '@/lib/public/hours';

/**
 * Renders the structured `working_hours` JSON in the reader's language.
 *
 * `list` is the full week for a directorate page aside; `inline` is the
 * compact one-line summary for listings. Both render nothing when the stored
 * value is missing or unusable — a half-broken schedule is worse than none.
 */
export default async function WorkingHours({
  value,
  variant = 'list',
  heading,
  className,
}: {
  value: unknown;
  variant?: 'list' | 'inline';
  heading?: string;
  className?: string;
}) {
  const parsed = parseWorkingHours(value);
  if (!parsed) return null;
  const groups = groupSchedule(parsed);

  const tDays = await getTranslations('days');
  const tDirectorate = await getTranslations('directorate');

  const daysLabel = (group: ScheduleGroup) => {
    const first = group.days[0];
    const last = group.days[group.days.length - 1];
    if (!first || !last) return '';
    return first === last ? tDays(first) : `${tDays(first)} – ${tDays(last)}`;
  };

  if (variant === 'inline') {
    const open = groups.filter((group) => group.from);
    if (open.length === 0) return null;
    return (
      <span className={className}>
        {open
          .map((group) => `${daysLabel(group)} ${group.from}–${group.to}`)
          .join(' · ')}
      </span>
    );
  }

  return (
    <div className={className}>
      {heading ? <h3 className="text-sm font-semibold text-ink-900">{heading}</h3> : null}
      <dl className="mt-1 space-y-1 text-sm">
        {groups.map((group) => (
          <div key={group.days[0]} className="flex items-baseline justify-between gap-4">
            <dt className="text-ink-600">{daysLabel(group)}</dt>
            <dd
              className={cn('font-medium', group.from ? 'text-ink-900 tabular' : 'text-ink-500')}
            >
              {group.from ? (
                <span dir="ltr">
                  {group.from} – {group.to}
                </span>
              ) : (
                tDirectorate('closed')
              )}
              {group.note ? (
                <span className="ms-1.5 font-normal text-ink-500">({group.note})</span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

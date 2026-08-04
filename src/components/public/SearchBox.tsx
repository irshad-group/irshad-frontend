import { inputClass, buttonClass, cn } from '@/components/ui/primitives';

/**
 * A plain GET form, not a client component.
 *
 * Submitting navigates to `/{locale}/search?q=…`, which means the result page
 * has a shareable, bookmarkable, crawlable URL and the search works with no
 * JavaScript at all. A scripted search box would buy instant results at the
 * cost of both, on connections where the script may never arrive.
 */
export default function SearchBox({
  locale,
  defaultValue = '',
  labels,
  size = 'default',
}: {
  locale: string;
  defaultValue?: string;
  labels: { label: string; placeholder: string; submit: string };
  size?: 'default' | 'large';
}) {
  return (
    <form action={`/${locale}/search`} role="search" className="flex gap-2">
      <label htmlFor="q" className="sr-only">
        {labels.label}
      </label>
      <input
        id="q"
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={labels.placeholder}
        className={cn(inputClass, size === 'large' && 'py-3 text-base')}
      />
      <button type="submit" className={buttonClass('primary', size === 'large' ? 'px-6' : '')}>
        {labels.submit}
      </button>
    </form>
  );
}

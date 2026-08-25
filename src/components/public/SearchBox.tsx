'use client';

import { inputClass, buttonClass, cn } from '@/components/ui/primitives';
import SuggestionList from './search/SuggestionList';
import { useSuggestions } from './search/useSuggestions';

/**
 * The search box on the results page, with live suggestions.
 *
 * Still a plain GET form underneath. Submitting navigates to
 * `/{locale}/search?q=…`, which means the result page has a shareable,
 * bookmarkable, crawlable URL and the search works with no JavaScript at all —
 * a Client Component is server-rendered like any other, so that form is what
 * arrives when the script never does. Suggestions are added on hydration and
 * are never the only route to a result: Enter with nothing highlighted submits
 * the form, exactly as before.
 *
 * `defaultValue` seeds the box on `/search?q=…`, so the reader can refine what
 * they typed rather than retyping it. The list stays shut until they focus or
 * type — arriving on a results page should not immediately cover those results
 * with a dropdown.
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
  const { rootRef, inputProps, listProps } = useSuggestions({ initialTerm: defaultValue });

  return (
    <div ref={rootRef} className="relative">
      <form action={`/${locale}/search`} role="search" className="flex gap-2">
        <label htmlFor="q" className="sr-only">
          {labels.label}
        </label>
        <input
          {...inputProps}
          id="q"
          type="search"
          name="q"
          // Without this the input's default size=20 gives it a ~300px
          // intrinsic width, which propagates into the min-content of every
          // ancestor. See the note in HeroSearch for what that cost the hero.
          size={1}
          placeholder={labels.placeholder}
          className={cn(inputClass, size === 'large' && 'py-3 text-base')}
        />
        <button type="submit" className={buttonClass('primary', size === 'large' ? 'px-6' : '')}>
          {labels.submit}
        </button>
      </form>

      <SuggestionList {...listProps} />
    </div>
  );
}

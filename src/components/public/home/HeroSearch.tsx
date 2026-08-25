'use client';

import { useLocale, useTranslations } from 'next-intl';
import SuggestionList from '../search/SuggestionList';
import { useSuggestions } from '../search/useSuggestions';
import { Icon } from './icons';

/**
 * The home search box, with live suggestions as the reader types.
 *
 * **The form still works with JavaScript disabled.** A Client Component is
 * server-rendered like any other, so what arrives without JS is exactly the
 * plain GET form this used to be: type, press Search, land on
 * `/{locale}/search?q=…` with a shareable, crawlable URL. Suggestions are
 * added on hydration and are never the only route to a result — the same
 * bargain `SearchBox` documents, kept rather than traded away.
 *
 * The behaviour lives in `useSuggestions`, shared with the box on the results
 * page. Only the markup is local to the hero.
 */
export default function HeroSearch({ placeholder }: { placeholder: string }) {
  const locale = useLocale();
  const t = useTranslations('search');
  const { rootRef, inputProps, listProps } = useSuggestions();

  return (
    <div ref={rootRef} className="relative mt-7 max-w-3xl">
      <form action={`/${locale}/search`} role="search">
        <div className="flex items-stretch border-2 border-ink-950 bg-white">
          <span className="flex items-center ps-4 text-ink-400">
            <Icon name="search" className="size-5" strokeWidth={2} />
          </span>
          <label htmlFor="q" className="sr-only">
            {t('label')}
          </label>
          {/*
            size={1} is load-bearing. An input defaults to size=20, which gives it an
            intrinsic width of roughly 300px. `min-w-0` lets it shrink once flex layout
            runs, but the intrinsic width still counts towards the min-content of every
            ancestor — including the hero's auto-sized grid track, which then refused to
            go below ~437px and pushed the whole page into horizontal scroll at 320px.
            flex-1 grows it back to fill the row.
          */}
          <input
            {...inputProps}
            id="q"
            type="search"
            name="q"
            size={1}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent px-3 py-4 text-base text-ink-950 outline-none placeholder:text-ink-400"
          />
          <button
            type="submit"
            className="bg-ink-950 px-6 text-sm font-bold text-white hover:bg-brand-500"
          >
            {t('submit')}
          </button>
        </div>
      </form>

      <SuggestionList {...listProps} />
    </div>
  );
}

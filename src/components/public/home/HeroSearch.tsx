'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { pbClient } from '@/lib/pb/client';
import { localized } from '@/lib/i18n';
import {
  highlightParts,
  PROCEDURE_SEARCH_FIELDS,
  searchFilter,
  shouldSuggest,
  SUGGEST_LIMIT,
} from '@/lib/public/search';
import { Icon } from './icons';

type Suggestion = { id: string; slug: string; title: string };

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
 * Reads go straight to PocketBase from the browser through `pbClient()`. There
 * is no route handler in between on purpose: the home page is static, and an
 * internal endpoint would need either its own cache story or a dynamic
 * dependency on the one page the performance budget cares most about.
 * PocketBase's API rules already decide what an anonymous reader may see, so
 * asking directly returns exactly what the results page would.
 */
export default function HeroSearch({ placeholder }: { placeholder: string }) {
  const locale = useLocale();
  const t = useTranslations('search');
  const router = useRouter();
  const listId = useId();
  const optionId = (index: number) => `${listId}-option-${index}`;

  const [term, setTerm] = useState('');
  // The results carry the term they were fetched for. Comparing that against
  // what is in the box means a stale list is never shown for a newer term —
  // and there is nothing to clear when the reader deletes back down to one
  // character, so the effect never has to setState synchronously.
  const [result, setResult] = useState<{ term: string; items: Suggestion[] } | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!shouldSuggest(term)) return;

    // One in-flight request at a time. Without the abort a slow response for
    // "pa" can land after a fast one for "passport" and overwrite it.
    const controller = new AbortController();
    // Typing is faster than the network on the connections this portal is
    // built for, so wait for a pause rather than firing per keystroke.
    const timer = setTimeout(async () => {
      try {
        const page = await pbClient()
          .collection('procedures')
          .getList(1, SUGGEST_LIMIT, {
            filter: searchFilter(term, PROCEDURE_SEARCH_FIELDS),
            fields: 'id,slug,title_en,title_ar,title_ku',
            signal: controller.signal,
          });
        setResult({
          term: term.trim(),
          items: page.items.map((record) => ({
            id: record.id as string,
            slug: record.slug as string,
            title: localized(record, 'title', locale),
          })),
        });
        setActive(-1);
      } catch {
        // A failed or aborted request must not replace what is on screen with
        // an error. The form underneath still works, so the reader loses a
        // convenience, not the feature.
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term, locale]);

  // A pointer press anywhere else dismisses the list.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const fresh = result !== null && result.term === term.trim();
  const list = fresh ? result.items : [];
  const visible = open && shouldSuggest(term) && fresh;
  const hasItems = visible && list.length > 0;

  function go(suggestion: Suggestion) {
    setOpen(false);
    router.push(`/procedures/${suggestion.slug}`);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!hasItems) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((current) => {
        const next = current + step;
        if (next < 0) return list.length - 1;
        if (next >= list.length) return 0;
        return next;
      });
      return;
    }

    // Enter on a highlighted suggestion opens it. With nothing highlighted the
    // form submits and the reader gets the full results page — the behaviour
    // they had before this existed.
    const chosen = active >= 0 ? list[active] : undefined;
    if (event.key === 'Enter' && chosen) {
      event.preventDefault();
      go(chosen);
    }
  }

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
            id="q"
            type="search"
            name="q"
            size={1}
            autoComplete="off"
            role="combobox"
            aria-expanded={hasItems}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? optionId(active) : undefined}
            value={term}
            onChange={(event) => {
              setTerm(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
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

      {/* Announced separately from the list so a screen reader hears the count
          change without every option being read out on each keystroke. */}
      <div aria-live="polite" className="sr-only">
        {visible ? t('suggestionCount', { count: list.length }) : ''}
      </div>

      {visible ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={t('suggestionsLabel')}
          className="absolute inset-x-0 top-full z-20 mt-1 border border-ink-200 bg-white shadow-lg"
        >
          {list.length === 0 ? (
            <li className="px-4 py-3 text-sm text-ink-600">{t('noSuggestions')}</li>
          ) : (
            list.map((item, index) => {
              const { before, match, after } = highlightParts(item.title, term);
              return (
                <li key={item.id} role="none">
                  <button
                    type="button"
                    id={optionId(index)}
                    role="option"
                    aria-selected={index === active}
                    tabIndex={-1}
                    onMouseEnter={() => setActive(index)}
                    // pointerdown fires before the input's blur, so the press is
                    // not swallowed by the list closing first.
                    onPointerDown={(event) => {
                      event.preventDefault();
                      go(item);
                    }}
                    // min-h-11 keeps every suggestion a 44px touch target.
                    className={`flex min-h-11 w-full items-center px-4 py-2 text-start text-sm ${
                      index === active ? 'bg-brand-50 text-brand-700' : 'text-ink-800'
                    }`}
                  >
                    <span dir="auto">
                      {before}
                      {match ? (
                        <mark className="bg-transparent font-bold text-inherit">{match}</mark>
                      ) : null}
                      {after}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}

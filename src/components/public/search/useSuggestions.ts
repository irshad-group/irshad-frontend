'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { pbClient } from '@/lib/pb/client';
import { localized } from '@/lib/i18n';
import {
  PROCEDURE_SEARCH_FIELDS,
  searchFilter,
  shouldSuggest,
  SUGGEST_LIMIT,
} from '@/lib/public/search';

export type Suggestion = { id: string; slug: string; title: string };

/**
 * Everything the two public search boxes need to offer live suggestions.
 *
 * The behaviour lives here rather than in either component because the hero
 * box and the one on the results page look nothing alike — a bordered slab
 * with the icon inside versus an input and a button with a gap between them —
 * while behaving identically. A shared hook keeps the debounce, the abort, the
 * keyboard model and the ARIA wiring in one place; a shared component with a
 * `variant` prop would have meant one of the two markups pretending to be the
 * other.
 *
 * Reads go straight to PocketBase through `pbClient()`. There is no route
 * handler in between on purpose: both callers sit on pages the performance
 * budget cares about, and PocketBase's API rules already decide what an
 * anonymous reader may see, so asking directly returns exactly what the
 * results page would.
 */
export function useSuggestions({ initialTerm = '' }: { initialTerm?: string } = {}) {
  const locale = useLocale();
  const router = useRouter();
  const listId = useId();
  const optionId = (index: number) => `${listId}-option-${index}`;

  const [term, setTerm] = useState(initialTerm);
  // Results carry the term they were fetched for. Comparing that against what
  // is in the box means a stale list is never shown for a newer term — and
  // there is nothing to clear when the reader deletes back down to one
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
  const items = fresh ? result.items : [];
  const visible = open && shouldSuggest(term) && fresh;
  const hasItems = visible && items.length > 0;

  function choose(suggestion: Suggestion) {
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
        if (next < 0) return items.length - 1;
        if (next >= items.length) return 0;
        return next;
      });
      return;
    }

    // Enter on a highlighted suggestion opens it. With nothing highlighted the
    // form submits and the reader gets the full results page — the behaviour
    // they had before suggestions existed.
    const chosen = active >= 0 ? items[active] : undefined;
    if (event.key === 'Enter' && chosen) {
      event.preventDefault();
      choose(chosen);
    }
  }

  return {
    rootRef,
    term,
    /** Spread onto the `<input>`. Add `id`, `name`, `placeholder` and styling. */
    inputProps: {
      autoComplete: 'off' as const,
      role: 'combobox' as const,
      'aria-expanded': hasItems,
      'aria-controls': listId,
      'aria-autocomplete': 'list' as const,
      'aria-activedescendant': active >= 0 ? optionId(active) : undefined,
      value: term,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
        setTerm(event.target.value);
        setOpen(true);
      },
      onFocus: () => setOpen(true),
      onKeyDown,
    },
    /** Spread onto `<SuggestionList>`. */
    listProps: {
      id: listId,
      visible,
      items,
      active,
      term,
      optionId,
      onHover: setActive,
      onChoose: choose,
    },
  };
}

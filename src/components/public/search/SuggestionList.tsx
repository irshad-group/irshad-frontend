'use client';

import { useTranslations } from 'next-intl';
import { highlightParts } from '@/lib/public/search';
import type { Suggestion } from './useSuggestions';

/**
 * The dropdown both public search boxes share.
 *
 * Positioned against the nearest positioned ancestor, which each caller
 * provides — so the list lines up with that box's own edges rather than
 * guessing at a width.
 */
export default function SuggestionList({
  id,
  visible,
  items,
  active,
  term,
  optionId,
  onHover,
  onChoose,
}: {
  id: string;
  visible: boolean;
  items: Suggestion[];
  active: number;
  term: string;
  optionId: (index: number) => string;
  onHover: (index: number) => void;
  onChoose: (suggestion: Suggestion) => void;
}) {
  const t = useTranslations('search');

  return (
    <>
      {/* Announced separately from the list so a screen reader hears the count
          change without every option being read out on each keystroke. */}
      <div aria-live="polite" className="sr-only">
        {visible ? t('suggestionCount', { count: items.length }) : ''}
      </div>

      {visible ? (
        <ul
          id={id}
          role="listbox"
          aria-label={t('suggestionsLabel')}
          className="absolute inset-x-0 top-full z-20 mt-1 border border-ink-200 bg-white shadow-lg"
        >
          {items.length === 0 ? (
            <li className="px-4 py-3 text-sm text-ink-600">{t('noSuggestions')}</li>
          ) : (
            items.map((item, index) => {
              // Only ever marks text the reader can see. Someone typing an
              // English term while reading Kurdish still gets the record — the
              // filter covers all three languages — but nothing is highlighted,
              // because the title on screen is not the field that matched.
              const { before, match, after } = highlightParts(item.title, term);
              return (
                <li key={item.id} role="none">
                  <button
                    type="button"
                    id={optionId(index)}
                    role="option"
                    aria-selected={index === active}
                    tabIndex={-1}
                    onMouseEnter={() => onHover(index)}
                    // pointerdown fires before the input's blur, so the press is
                    // not swallowed by the list closing first.
                    onPointerDown={(event) => {
                      event.preventDefault();
                      onChoose(item);
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
    </>
  );
}

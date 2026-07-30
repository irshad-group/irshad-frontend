'use client';

import { useRouter, usePathname } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { buttonClass, cn, inputClass } from '@/components/ui/primitives';

export function SearchBox({ placeholder, label }: { placeholder: string; label: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get('q') ?? '');
  const [pending, start] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const next = new URLSearchParams(params.toString());
    if (value.trim()) next.set('q', value.trim());
    else next.delete('q');
    // Any filter change invalidates the current page number.
    next.delete('page');
    start(() => router.push(`${pathname}?${next.toString()}`));
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(inputClass, 'w-64')}
      />
      <button type="submit" disabled={pending} className={buttonClass('secondary')}>
        {label}
      </button>
    </form>
  );
}

export function Pagination({
  page,
  totalPages,
  labels,
}: {
  page: number;
  totalPages: number;
  labels: { previous: string; next: string; summary: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function go(to: number) {
    const next = new URLSearchParams(params.toString());
    next.set('page', String(to));
    router.push(`${pathname}?${next.toString()}`);
  }

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-ink-200 px-4 py-3">
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        className={buttonClass('secondary')}
      >
        {labels.previous}
      </button>
      <span className="text-sm text-ink-500">{labels.summary}</span>
      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
        className={buttonClass('secondary')}
      >
        {labels.next}
      </button>
    </div>
  );
}

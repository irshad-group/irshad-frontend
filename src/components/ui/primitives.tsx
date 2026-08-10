import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

const BUTTON_VARIANTS = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 disabled:bg-brand-500/50',
  secondary: 'bg-white text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50 disabled:text-ink-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-600/50',
  ghost: 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;

export function buttonClass(variant: ButtonVariant = 'primary', extra?: string): string {
  return cn(
    'inline-flex items-center justify-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed',
    BUTTON_VARIANTS[variant],
    extra,
  );
}

export function Button({
  variant = 'primary',
  className,
  ...props
}: ComponentPropsWithoutRef<'button'> & { variant?: ButtonVariant }) {
  return <button {...props} className={buttonClass(variant, className)} />;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-lg bg-white ring-1 ring-ink-200/70', className)}>{children}</div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-ink-900">{title}</h1>
        {description ? <p className="mt-1 text-sm text-ink-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

const BADGE_TONES = {
  neutral: 'bg-ink-100 text-ink-700',
  good: 'bg-emerald-50 text-emerald-700',
  warn: 'bg-amber-50 text-amber-700',
  bad: 'bg-red-50 text-red-700',
} as const;

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: keyof typeof BADGE_TONES;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium whitespace-nowrap',
        BADGE_TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

export function BoolMark({ value }: { value: unknown }) {
  const on = value === true;
  return (
    <span
      aria-label={on ? 'yes' : 'no'}
      className={cn('text-sm font-medium', on ? 'text-emerald-600' : 'text-ink-300')}
    >
      {on ? '✓' : '—'}
    </span>
  );
}

export function Alert({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-md px-3 py-2 text-sm ring-1',
        tone === 'error'
          ? 'bg-red-50 text-red-800 ring-red-200'
          : 'bg-emerald-50 text-emerald-800 ring-emerald-200',
      )}
    >
      {children}
    </div>
  );
}

export const inputClass =
  'block w-full rounded-md border-0 bg-white px-3 py-2 text-sm text-ink-900 ring-1 ring-ink-200 placeholder:text-ink-400 focus:ring-2 focus:ring-brand-500';

/* -------------------------------------------------------------------------- *
 * Public portal primitives
 *
 * Shared by every citizen-facing page so the portal reads as one system rather
 * than a set of separately composed screens. All spacing here is logical, so
 * the same classes mirror correctly in Arabic and Kurdish.
 * -------------------------------------------------------------------------- */

/** Standard page width. `narrow` is for continuous reading, `wide` for grids. */
export function Container({
  children,
  width = 'default',
  className,
}: {
  children: ReactNode;
  width?: 'narrow' | 'default' | 'wide';
  className?: string;
}) {
  const widths = {
    narrow: 'max-w-2xl',
    default: 'max-w-5xl',
    wide: 'max-w-7xl',
  } as const;
  return (
    <div className={cn('mx-auto w-full px-4 sm:px-6', widths[width], className)}>{children}</div>
  );
}

/**
 * Rich text out of the `editor` fields.
 *
 * `dir="auto"` lets the first strong character decide direction per block, which
 * matters when staff paste an English paragraph into an Arabic record — without
 * it the punctuation ends up on the wrong side.
 */
export function Prose({ html, className }: { html: string; className?: string }) {
  return (
    <div
      dir="auto"
      className={cn('prose-content max-w-[var(--measure-prose)] text-ink-700', className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * An empty list is normal here, not an error — a directorate may have no
 * branches yet, a procedure no forms. Say so plainly and, where there is one,
 * offer a way onward rather than leaving a dead end.
 */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg bg-white px-6 py-10 text-center ring-1 ring-ink-200/70">
      <p className="text-sm font-medium text-ink-900">{title}</p>
      {description ? (
        <p className="mx-auto mt-1 max-w-[var(--measure-narrow)] text-sm text-ink-500">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

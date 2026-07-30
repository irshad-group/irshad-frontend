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

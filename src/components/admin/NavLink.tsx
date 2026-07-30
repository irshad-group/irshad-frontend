'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/components/ui/primitives';

/**
 * `usePathname` from next-intl returns the path without the locale prefix,
 * so the comparison stays the same in all three languages.
 */
export default function NavLink({
  href,
  label,
  exact = false,
}: {
  href: string;
  label: string;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'block truncate rounded-md px-2.5 py-1.5 text-sm',
        active ? 'bg-brand-50 font-medium text-brand-700' : 'text-ink-600 hover:bg-ink-50',
      )}
    >
      {label}
    </Link>
  );
}

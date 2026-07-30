'use client';

import { useTransition } from 'react';
import { signOut } from '@/lib/admin/actions';
import { buttonClass } from '@/components/ui/primitives';

export default function SignOutButton({ locale, label }: { locale: string; label: string }) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => void signOut(locale))}
      className={buttonClass('secondary', 'w-full')}
    >
      {label}
    </button>
  );
}

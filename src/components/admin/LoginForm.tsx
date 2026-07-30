'use client';

import { useActionState, useState } from 'react';
import type { ActionState } from '@/lib/admin/actions';
import { Alert, buttonClass, inputClass } from '@/components/ui/primitives';

const INITIAL: ActionState = { ok: false };

// Controlled on purpose: React 19 resets an uncontrolled form once the action
// resolves, so after a rejected sign-in the email box would be emptied and the
// browser's `required` check would then block the retry with no visible cause.

export default function LoginForm({
  action,
  next,
  labels,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  next: string;
  labels: { email: string; password: string; signIn: string; saving: string };
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      {state.message && !state.ok ? <Alert tone="error">{state.message}</Alert> : null}

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink-700">
          {labels.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink-700">
          {labels.password}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </div>

      <button type="submit" disabled={pending} className={buttonClass('primary', 'w-full')}>
        {pending ? labels.saving : labels.signIn}
      </button>
    </form>
  );
}

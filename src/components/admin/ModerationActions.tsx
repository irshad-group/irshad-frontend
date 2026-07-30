'use client';

import { useState, useTransition } from 'react';
import type { ActionState } from '@/lib/admin/actions';
import { buttonClass } from '@/components/ui/primitives';

export default function ModerationActions({
  approve,
  reject,
  labels,
}: {
  approve: () => Promise<ActionState>;
  reject?: () => Promise<ActionState>;
  labels: { approve: string; unapprove?: string };
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<ActionState>) =>
    start(async () => {
      const result = await fn();
      setError(result.ok ? null : (result.message ?? 'Failed.'));
    });

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => run(approve)}
        className={buttonClass('primary', 'px-2.5 py-1 text-xs')}
      >
        {labels.approve}
      </button>
      {reject && labels.unapprove ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(reject)}
          className={buttonClass('secondary', 'px-2.5 py-1 text-xs')}
        >
          {labels.unapprove}
        </button>
      ) : null}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}

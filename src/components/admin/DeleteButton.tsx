'use client';

import { useState, useTransition } from 'react';
import type { ActionState } from '@/lib/admin/actions';
import { Alert, buttonClass } from '@/components/ui/primitives';

export default function DeleteButton({
  action,
  labels,
}: {
  action: () => Promise<ActionState>;
  labels: { delete: string; confirm: string };
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {error ? <Alert tone="error">{error}</Alert> : null}
      <button
        type="button"
        disabled={pending}
        className={buttonClass('danger')}
        onClick={() => {
          if (!window.confirm(labels.confirm)) return;
          start(async () => {
            // A successful delete redirects, so anything returned here is a refusal.
            const result = await action();
            if (result && !result.ok) setError(result.message ?? 'Delete failed.');
          });
        }}
      >
        {labels.delete}
      </button>
    </div>
  );
}

'use client';

import { useActionState } from 'react';
import { submitContact, type ContactState } from '@/app/[locale]/(public)/contact/actions';
import { Alert, buttonClass, cn, inputClass } from '@/components/ui/primitives';

type Labels = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneOptional: string;
  message: string;
  submit: string;
  sending: string;
  sent: string;
  failed: string;
  errors: Record<string, string>;
};

const initial: ContactState = { status: 'idle' };

/**
 * The contact form.
 *
 * Inputs are controlled from the state the action returns rather than left
 * uncontrolled. React 19 resets an uncontrolled form once its action resolves,
 * which would wipe everything a visitor typed the moment validation failed —
 * the same defect that was found and fixed in the admin sign-in form.
 *
 * Errors are rendered from codes looked up in the message catalogue, so they
 * appear in the visitor's own language rather than in whatever the validator
 * happens to speak.
 */
export default function ContactForm({ labels }: { labels: Labels }) {
  const [state, action, pending] = useActionState(submitContact, initial);

  if (state.status === 'sent') {
    return <Alert tone="success">{labels.sent}</Alert>;
  }

  const value = (name: string) => state.values?.[name] ?? '';
  const error = (name: string) =>
    state.errors?.[name as keyof typeof state.errors]
      ? (labels.errors[state.errors[name as keyof typeof state.errors] as string] ??
        labels.errors.invalid)
      : undefined;

  return (
    <form action={action} className="space-y-4" noValidate>
      {/* A failure with no field errors is the server or PocketBase, not the visitor. */}
      {state.status === 'error' && !state.errors ? (
        <Alert tone="error">{labels.failed}</Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="first_name" label={labels.firstName} error={error('first_name')}>
          <input
            id="first_name"
            name="first_name"
            defaultValue={value('first_name')}
            required
            maxLength={64}
            autoComplete="given-name"
            aria-invalid={error('first_name') ? true : undefined}
            aria-describedby={error('first_name') ? 'first_name-error' : undefined}
            className={inputClass}
          />
        </Field>
        <Field name="last_name" label={labels.lastName} error={error('last_name')}>
          <input
            id="last_name"
            name="last_name"
            defaultValue={value('last_name')}
            required
            maxLength={64}
            autoComplete="family-name"
            aria-invalid={error('last_name') ? true : undefined}
            aria-describedby={error('last_name') ? 'last_name-error' : undefined}
            className={inputClass}
          />
        </Field>
      </div>

      <Field name="email" label={labels.email} error={error('email')}>
        <input
          id="email"
          name="email"
          type="email"
          dir="ltr"
          defaultValue={value('email')}
          required
          maxLength={255}
          autoComplete="email"
          aria-invalid={error('email') ? true : undefined}
          aria-describedby={error('email') ? 'email-error' : undefined}
          className={inputClass}
        />
      </Field>

      <Field
        name="phone"
        label={`${labels.phone} ${labels.phoneOptional}`}
        error={error('phone')}
      >
        <input
          id="phone"
          name="phone"
          type="tel"
          dir="ltr"
          defaultValue={value('phone')}
          maxLength={32}
          autoComplete="tel"
          aria-invalid={error('phone') ? true : undefined}
          aria-describedby={error('phone') ? 'phone-error' : undefined}
          className={inputClass}
        />
      </Field>

      <Field name="message" label={labels.message} error={error('message')}>
        <textarea
          id="message"
          name="message"
          rows={6}
          defaultValue={value('message')}
          required
          maxLength={4000}
          aria-invalid={error('message') ? true : undefined}
          aria-describedby={error('message') ? 'message-error' : undefined}
          className={cn(inputClass, 'resize-y')}
        />
      </Field>

      {/* Honeypot: off-screen rather than display:none, and explicitly hidden
          from assistive technology, so a screen-reader user never meets it. */}
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <button type="submit" disabled={pending} className={buttonClass('primary')}>
        {pending ? labels.sending : labels.submit}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  error,
  children,
}: {
  name: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-ink-800">
        {label}
      </label>
      <div className="mt-1">{children}</div>
      {error ? (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

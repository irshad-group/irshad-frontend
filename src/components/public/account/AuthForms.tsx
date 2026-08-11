'use client';

import { useActionState, useState } from 'react';
import {
  register,
  requestOtp,
  signIn,
  signInWithOtp,
  type AuthState,
  type OtpState,
} from '@/app/[locale]/(public)/account/actions';

/**
 * The citizen auth forms. Client components only for `useActionState` — every
 * submission is a real form post to a Server Action, so all of it works with
 * JavaScript disabled; the hooks add preserved values and inline errors.
 *
 * All strings arrive as props from the server page: labels for the chrome and
 * an `errors` map from message-catalogue codes to sentences in the visitor's
 * language.
 */

export type AuthLabels = {
  email: string;
  password: string;
  passwordConfirm: string;
  fullName: string;
  signInBtn: string;
  registerBtn: string;
  otpHeading: string;
  otpIntro: string;
  otpRequest: string;
  otpCodeLabel: string;
  otpVerify: string;
  otpSentTo: string;
  otpBack: string;
  errors: Record<string, string>;
};

const IDLE: AuthState = { status: 'idle' };

const inputClass =
  'block w-full border border-ink-300 bg-white px-3 py-2.5 text-sm text-ink-950 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30';
const labelClass = 'mb-1 block text-sm font-semibold text-ink-700';
const buttonClass =
  'w-full bg-brand-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-500/60';

function ErrorLine({ code, labels }: { code?: string; labels: AuthLabels }) {
  if (!code) return null;
  return (
    <p role="alert" className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
      {labels.errors[code] ?? labels.errors.invalid}
    </p>
  );
}

export function PasswordLoginForm({ labels }: { labels: AuthLabels }) {
  const [state, action, pending] = useActionState(signIn, IDLE);
  return (
    <form action={action} className="space-y-4">
      <ErrorLine code={state.errors?.form} labels={labels} />
      <div>
        <label htmlFor="login-email" className={labelClass}>
          {labels.email}
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          required
          autoComplete="username"
          defaultValue={state.values?.email ?? ''}
          className={inputClass}
          dir="ltr"
        />
      </div>
      <div>
        <label htmlFor="login-password" className={labelClass}>
          {labels.password}
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
          dir="ltr"
        />
      </div>
      <button type="submit" disabled={pending} className={buttonClass}>
        {labels.signInBtn}
      </button>
    </form>
  );
}

export function OtpLoginForm({ labels }: { labels: AuthLabels }) {
  const [requestState, requestAction, requesting] = useActionState(requestOtp, {
    stage: 'email',
  } as OtpState);
  const [verifyState, verifyAction, verifying] = useActionState(signInWithOtp, {
    stage: 'code',
  } as OtpState);
  const [backToEmail, setBackToEmail] = useState(false);

  const showCode = requestState.stage === 'code' && !backToEmail;

  if (!showCode) {
    return (
      <form action={requestAction} className="space-y-4" onSubmit={() => setBackToEmail(false)}>
        <p className="text-sm text-ink-600">{labels.otpIntro}</p>
        <ErrorLine code={requestState.error} labels={labels} />
        <div>
          <label htmlFor="otp-email" className={labelClass}>
            {labels.email}
          </label>
          <input
            id="otp-email"
            name="email"
            type="email"
            required
            autoComplete="username"
            defaultValue={requestState.email ?? ''}
            className={inputClass}
            dir="ltr"
          />
        </div>
        <button type="submit" disabled={requesting} className={buttonClass}>
          {labels.otpRequest}
        </button>
      </form>
    );
  }

  return (
    <form action={verifyAction} className="space-y-4">
      <p className="text-sm text-ink-600">
        {labels.otpSentTo.replace('{email}', requestState.email ?? '')}
      </p>
      <ErrorLine code={verifyState.error} labels={labels} />
      <input type="hidden" name="otpId" value={verifyState.otpId ?? requestState.otpId ?? ''} />
      <input type="hidden" name="email" value={requestState.email ?? ''} />
      <div>
        <label htmlFor="otp-code" className={labelClass}>
          {labels.otpCodeLabel}
        </label>
        <input
          id="otp-code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={8}
          required
          className={`${inputClass} text-center text-lg tracking-[0.4em] tabular`}
          dir="ltr"
        />
      </div>
      <button type="submit" disabled={verifying} className={buttonClass}>
        {labels.otpVerify}
      </button>
      <button
        type="button"
        onClick={() => setBackToEmail(true)}
        className="w-full text-sm font-semibold text-brand-500 hover:text-brand-600"
      >
        {labels.otpBack}
      </button>
    </form>
  );
}

export function RegisterForm({ labels }: { labels: AuthLabels }) {
  const [state, action, pending] = useActionState(register, IDLE);
  const fieldError = (field: string) =>
    state.errors?.[field] ? (
      <p className="mt-1 text-xs text-red-700">
        {labels.errors[state.errors[field]] ?? labels.errors.invalid}
      </p>
    ) : null;

  return (
    <form action={action} className="space-y-4">
      <ErrorLine code={state.errors?.form} labels={labels} />
      <div>
        <label htmlFor="reg-name" className={labelClass}>
          {labels.fullName}
        </label>
        <input
          id="reg-name"
          name="full_name"
          required
          autoComplete="name"
          defaultValue={state.values?.full_name ?? ''}
          className={inputClass}
        />
        {fieldError('full_name')}
      </div>
      <div>
        <label htmlFor="reg-email" className={labelClass}>
          {labels.email}
        </label>
        <input
          id="reg-email"
          name="email"
          type="email"
          required
          autoComplete="username"
          defaultValue={state.values?.email ?? ''}
          className={inputClass}
          dir="ltr"
        />
        {fieldError('email')}
      </div>
      <div>
        <label htmlFor="reg-password" className={labelClass}>
          {labels.password}
        </label>
        <input
          id="reg-password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
          dir="ltr"
        />
        {fieldError('password')}
      </div>
      <div>
        <label htmlFor="reg-password2" className={labelClass}>
          {labels.passwordConfirm}
        </label>
        <input
          id="reg-password2"
          name="passwordConfirm"
          type="password"
          required
          autoComplete="new-password"
          className={inputClass}
          dir="ltr"
        />
        {fieldError('passwordConfirm')}
      </div>
      <button type="submit" disabled={pending} className={buttonClass}>
        {labels.registerBtn}
      </button>
    </form>
  );
}

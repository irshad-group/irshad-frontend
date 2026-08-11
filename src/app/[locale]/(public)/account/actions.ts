'use server';

import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import PocketBase from 'pocketbase';
import { z } from 'zod';
import { clearAuthCookie, setAuthCookie } from '@/lib/auth';
import { PB_URL, pbServer } from '@/lib/pb/server';
import {
  submissionLooksAutomated,
  validateSubmission,
  type SubmissionErrors,
} from '@/lib/public/submissions';

/**
 * Citizen account actions. Everything here runs as the visitor — an anonymous
 * client for register/sign-in (the `users` create rule only permits
 * `role = "user"`), and the cookie-scoped client for anything after. No
 * superuser client appears anywhere in this file, deliberately: the API rules
 * are the enforcement and these actions must live under them.
 *
 * Failures are reported as message-catalogue codes, and sign-in style errors
 * are deliberately vague — "wrong password" versus "no such account" is an
 * enumeration oracle.
 */

function pbAnonymous(): PocketBase {
  const pb = new PocketBase(PB_URL);
  pb.autoCancellation(false);
  return pb;
}

export type AuthState = {
  status: 'idle' | 'error';
  /** Field-keyed message codes under `account.errors.*`. */
  errors?: Record<string, string>;
  /** Echoed back so a failed submission does not empty the form. */
  values?: Record<string, string>;
};

const registerSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  passwordConfirm: z.string(),
});

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const locale = await getLocale();
  const raw = Object.fromEntries(formData.entries()) as Record<string, string>;
  const values = { full_name: raw.full_name ?? '', email: raw.email ?? '' };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of [...parsed.error.issues].reverse()) {
      const field = String(issue.path[0]);
      errors[field] =
        field === 'email'
          ? 'invalidEmail'
          : field === 'full_name'
            ? 'nameRequired'
            : 'passwordShort';
    }
    return { status: 'error', errors, values };
  }
  if (parsed.data.password !== parsed.data.passwordConfirm) {
    return { status: 'error', errors: { passwordConfirm: 'passwordMismatch' }, values };
  }

  const pb = pbAnonymous();
  try {
    // `role` is pinned server-side; the create rule would refuse anything else.
    await pb.collection('users').create({
      email: parsed.data.email,
      password: parsed.data.password,
      passwordConfirm: parsed.data.passwordConfirm,
      full_name: parsed.data.full_name,
      role: 'user',
    });
    await pb.collection('users').authWithPassword(parsed.data.email, parsed.data.password);
  } catch {
    // Covers "email already registered" without confirming that it is.
    return { status: 'error', errors: { form: 'registrationFailed' }, values };
  }

  await setAuthCookie(pb);
  redirect(`/${locale}/account`);
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const locale = await getLocale();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const values = { email };

  if (!email || !password) {
    return { status: 'error', errors: { form: 'signInFailed' }, values };
  }

  const pb = pbAnonymous();
  try {
    await pb.collection('users').authWithPassword(email, password);
  } catch {
    return { status: 'error', errors: { form: 'signInFailed' }, values };
  }

  await setAuthCookie(pb);
  redirect(`/${locale}/account`);
}

export type OtpState = {
  stage: 'email' | 'code';
  otpId?: string;
  email?: string;
  error?: string;
};

export async function requestOtp(_prev: OtpState, formData: FormData): Promise<OtpState> {
  const email = String(formData.get('email') ?? '').trim();
  if (!email || !z.string().email().safeParse(email).success) {
    return { stage: 'email', error: 'invalidEmail' };
  }

  try {
    const result = await pbAnonymous().collection('users').requestOTP(email);
    return { stage: 'code', otpId: result.otpId, email };
  } catch {
    // PocketBase already answers unknown addresses with a dummy otpId; an
    // actual failure here is SMTP or connectivity, which the visitor cannot
    // distinguish from a wrong address anyway.
    return { stage: 'email', error: 'otpFailed' };
  }
}

export async function signInWithOtp(_prev: OtpState, formData: FormData): Promise<OtpState> {
  const locale = await getLocale();
  const otpId = String(formData.get('otpId') ?? '');
  const email = String(formData.get('email') ?? '');
  const code = String(formData.get('code') ?? '').trim();

  if (!otpId || !code) return { stage: 'code', otpId, email, error: 'codeInvalid' };

  const pb = pbAnonymous();
  try {
    await pb.collection('users').authWithOTP(otpId, code);
  } catch {
    return { stage: 'code', otpId, email, error: 'codeInvalid' };
  }

  await setAuthCookie(pb);
  redirect(`/${locale}/account`);
}

export async function signOut(): Promise<void> {
  const locale = await getLocale();
  await clearAuthCookie();
  redirect(`/${locale}`);
}

export type SubmissionState = {
  status: 'idle' | 'error';
  errors?: SubmissionErrors & { form?: string };
  values?: Record<string, string>;
};

export async function submitProcedure(
  _prev: SubmissionState,
  formData: FormData,
): Promise<SubmissionState> {
  const locale = await getLocale();
  const raw = Object.fromEntries(formData.entries()) as Record<string, string>;
  const values = Object.fromEntries(
    Object.entries(raw).filter(([key]) => key !== 'website'),
  ) as Record<string, string>;

  // Same honeypot contract as the contact form: pretend success.
  if (submissionLooksAutomated(raw)) redirect(`/${locale}/account?submitted=1`);

  const pb = await pbServer();
  const userId = pb.authStore.record?.id;
  if (!pb.authStore.isValid || !userId) {
    redirect(`/${locale}/account/login`);
  }

  const result = validateSubmission(raw);
  if (!result.ok) return { status: 'error', errors: result.errors, values };

  try {
    // Created as the signed-in user; the collection rule requires
    // `user = @request.auth.id` and `status = "submitted"`, so neither can be
    // forged from here or anywhere else.
    await pb.collection('procedure_submissions').create({
      ...result.data,
      user: userId,
      status: 'submitted',
    });
  } catch {
    return { status: 'error', errors: { form: 'submitFailed' }, values };
  }

  redirect(`/${locale}/account?submitted=1`);
}

export async function deleteSubmission(formData: FormData): Promise<void> {
  const locale = await getLocale();
  const id = String(formData.get('id') ?? '');
  if (id) {
    const pb = await pbServer();
    try {
      // The delete rule limits this to the owner while status = "submitted".
      await pb.collection('procedure_submissions').delete(id);
    } catch {
      // Refused or already gone — the list re-render tells the truth either way.
    }
  }
  redirect(`/${locale}/account`);
}

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSessionUser, isAdmin, isStaff, setAuthCookie, clearAuthCookie } from '@/lib/auth';
import { fieldErrors } from '@/lib/pb/collections';
import { pbServer, PB_URL } from '@/lib/pb/server';
import PocketBase from 'pocketbase';
import { getCollectionDef } from './registry';
import { checkSingleTarget, parseForm } from './schema';

export type ActionState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
  id?: string;
};

const GENERIC_DENIED: ActionState = {
  ok: false,
  message: 'You do not have permission to do that.',
};

/** Server Actions are public HTTP endpoints — re-check the session in every one. */
async function requireStaff() {
  const user = await getSessionUser();
  if (!isStaff(user)) return null;
  return user;
}

function adminPath(locale: string, collection: string, suffix = '') {
  return `/${locale}/admin/${collection}${suffix}`;
}

/**
 * Turns validated values plus any uploaded files into a PocketBase payload.
 * Returns FormData when files are involved, a plain object otherwise.
 */
function buildPayload(
  collection: string,
  data: Record<string, unknown>,
  formData: FormData,
): Record<string, unknown> | FormData {
  const def = getCollectionDef(collection);
  const fileFields = (def?.fields ?? []).filter((f) => f.kind === 'file');

  const uploads: Array<[string, File]> = [];
  const clears: string[] = [];

  for (const field of fileFields) {
    if (formData.get(`${field.name}__clear`) === 'on') {
      clears.push(field.name);
      continue;
    }
    // A multi-file field appends (PocketBase's `field+` modifier) so uploading
    // adds to the gallery instead of replacing it; single files replace.
    const key = field.multiple ? `${field.name}+` : field.name;
    for (const file of formData.getAll(field.name)) {
      // An untouched file input still submits an empty File; skipping it leaves
      // the stored file alone, which is what an editor expects.
      if (file instanceof File && file.size > 0) uploads.push([key, file]);
    }
  }

  if (!uploads.length && !clears.length) {
    return data;
  }

  const jsonFields = new Set(
    (def?.fields ?? []).filter((f) => f.kind === 'json').map((f) => f.name),
  );

  const payload = new FormData();
  for (const [key, value] of Object.entries(data)) {
    // A json field is a parsed value by now; String() would turn an array of
    // day objects into "[object Object]" entries and destroy the schedule.
    if (jsonFields.has(key)) {
      payload.append(key, value === undefined || value === null ? '' : JSON.stringify(value));
      continue;
    }
    if (Array.isArray(value)) {
      if (!value.length) payload.append(key, '');
      else value.forEach((v) => payload.append(key, String(v)));
      continue;
    }
    payload.append(key, value === undefined || value === null ? '' : String(value));
  }
  for (const [key, file] of uploads) payload.append(key, file);
  for (const key of clears) payload.append(key, '');
  return payload;
}

export async function saveRecord(
  locale: string,
  collection: string,
  recordId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const def = getCollectionDef(collection);
  if (!def) return { ok: false, message: 'Unknown collection.' };

  const user = await requireStaff();
  if (!user) return GENERIC_DENIED;
  if (def.adminOnly && !isAdmin(user)) return GENERIC_DENIED;

  const parsed = parseForm(def, formData);
  if (!parsed.ok) {
    return { ok: false, message: 'Please correct the highlighted fields.', errors: parsed.errors };
  }

  const conflict = checkSingleTarget(collection, parsed.data);
  if (conflict) return { ok: false, message: conflict };

  const payload = buildPayload(collection, parsed.data, formData);
  const pb = await pbServer();

  let savedId = recordId ?? '';
  try {
    if (recordId) {
      await pb.collection(collection).update(recordId, payload);
    } else {
      const created = await pb.collection(collection).create(payload);
      savedId = created.id;
    }
  } catch (error) {
    const errors = fieldErrors(error);
    return {
      ok: false,
      message: Object.keys(errors).length
        ? 'PocketBase rejected the record.'
        : 'Could not save. The server rejected the request — you may not have permission.',
      errors,
    };
  }

  revalidatePath(adminPath(locale, collection));
  revalidatePath(adminPath(locale, collection, `/${savedId}`));

  if (!recordId) redirect(adminPath(locale, collection, `/${savedId}`));
  return { ok: true, message: 'Saved.', id: savedId };
}

export async function deleteRecord(
  locale: string,
  collection: string,
  recordId: string,
): Promise<ActionState> {
  const def = getCollectionDef(collection);
  if (!def?.canDelete) return { ok: false, message: 'This collection cannot be deleted from here.' };

  const user = await requireStaff();
  if (!user) return GENERIC_DENIED;

  const pb = await pbServer();
  try {
    await pb.collection(collection).delete(recordId);
  } catch {
    // Most collections restrict deletes to admins at the API-rule level, so a
    // moderator reaching this point gets the server's refusal, not a UI guess.
    return { ok: false, message: 'Delete refused. Most collections allow deletion by admins only.' };
  }

  revalidatePath(adminPath(locale, collection));
  redirect(adminPath(locale, collection));
}

/** Moderation shortcut used by the comment and review queues. */
export async function setApproval(
  locale: string,
  collection: 'comments' | 'reviews',
  recordId: string,
  approved: boolean,
): Promise<ActionState> {
  const user = await requireStaff();
  if (!user) return GENERIC_DENIED;

  const pb = await pbServer();
  try {
    await pb.collection(collection).update(recordId, { approved });
  } catch {
    return { ok: false, message: 'Could not update moderation status.' };
  }

  revalidatePath(adminPath(locale, collection));
  revalidatePath(`/${locale}/admin`);
  return { ok: true, message: approved ? 'Approved.' : 'Unapproved.' };
}

export async function setContactStatus(
  locale: string,
  recordId: string,
  status: 'new' | 'in_progress' | 'resolved' | 'spam',
): Promise<ActionState> {
  const user = await requireStaff();
  if (!user) return GENERIC_DENIED;

  const pb = await pbServer();
  try {
    await pb.collection('contact').update(recordId, {
      status,
      handled_by: status === 'new' ? '' : user.id,
    });
  } catch {
    return { ok: false, message: 'Could not update the message.' };
  }

  revalidatePath(adminPath(locale, 'contact'));
  revalidatePath(`/${locale}/admin`);
  return { ok: true, message: 'Updated.' };
}

// ------------------------------------------------------------------ session

export async function signIn(
  locale: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? '');

  if (!email || !password) {
    return { ok: false, message: 'Enter your email address and password.' };
  }

  // A dedicated instance: this request has no session yet, and we do not want
  // to disturb the per-request store used elsewhere.
  const pb = new PocketBase(PB_URL);
  pb.autoCancellation(false);

  try {
    await pb.collection('users').authWithPassword(email, password);
  } catch {
    // Deliberately not distinguishing "no such user" from "wrong password".
    return { ok: false, message: 'Those credentials were not recognised.' };
  }

  const role = pb.authStore.record?.role;
  if (role !== 'admin' && role !== 'moderator') {
    pb.authStore.clear();
    // Same wording as a bad password, so this cannot be used to discover which
    // addresses belong to staff.
    return { ok: false, message: 'Those credentials were not recognised.' };
  }

  await setAuthCookie(pb);

  const destination =
    next.startsWith(`/${locale}/admin`) && !next.includes('/admin/login')
      ? next
      : `/${locale}/admin`;
  redirect(destination);
}

export async function signOut(locale: string): Promise<void> {
  await clearAuthCookie();
  redirect(`/${locale}/admin/login`);
}

// Nothing else belongs in this file. Every export of a `'use server'` module
// becomes a publicly callable HTTP endpoint, so helpers that only ever run on
// the server live in `./data.ts` instead.

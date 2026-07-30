import 'server-only';

import { cookies } from 'next/headers';
import type PocketBase from 'pocketbase';
import type { UserRole, UsersRecord } from '@/types/pb';
import { AUTH_COOKIE, pbServer } from './pb/server';

export type SessionUser = Pick<
  UsersRecord,
  'id' | 'email' | 'full_name' | 'job_title' | 'role' | 'avatar' | 'verified'
> & { collectionId: string };

const STAFF: readonly UserRole[] = ['moderator', 'admin'];

/**
 * The signed-in user for this request, or null.
 *
 * The cookie is not trusted on its own: this round-trips to PocketBase so a
 * revoked token, a deleted user, or a role that changed since sign-in is caught
 * here rather than being read out of a stale cookie payload.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const pb = await pbServer();
  if (!pb.authStore.isValid || !pb.authStore.record) return null;

  try {
    const { record } = await pb.collection('users').authRefresh();
    return {
      id: record.id,
      collectionId: record.collectionId,
      email: record.email,
      full_name: record.full_name,
      job_title: record.job_title,
      role: record.role,
      avatar: record.avatar,
      verified: record.verified,
    } as SessionUser;
  } catch {
    return null;
  }
}

export function isStaff(user: Pick<SessionUser, 'role'> | null | undefined): boolean {
  return !!user && STAFF.includes(user.role);
}

export function isAdmin(user: Pick<SessionUser, 'role'> | null | undefined): boolean {
  return user?.role === 'admin';
}

/**
 * Persist the authenticated session in an httpOnly cookie.
 *
 * The payload is produced by `exportToCookie` rather than assembled by hand, so
 * whatever shape `loadFromCookie` expects stays in sync across SDK upgrades.
 * We keep only the value and re-apply our own cookie attributes through Next.
 */
export async function setAuthCookie(pb: PocketBase): Promise<void> {
  const serialised = pb.authStore.exportToCookie({ httpOnly: true }, AUTH_COOKIE);
  const value = decodeURIComponent(serialised.slice(serialised.indexOf('=') + 1).split(';')[0] ?? '');

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    // Mirrors the `users` collection authToken duration (7 days).
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
}

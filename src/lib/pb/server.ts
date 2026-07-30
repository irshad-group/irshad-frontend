import 'server-only';

import { cookies } from 'next/headers';
import PocketBase from 'pocketbase';

export const PB_URL = process.env.NEXT_PUBLIC_PB_URL ?? '';

/** Name of the httpOnly cookie carrying the PocketBase auth token. */
export const AUTH_COOKIE = 'pb_auth';

/**
 * A PocketBase instance scoped to the current request.
 *
 * This is deliberately NOT a module-level singleton. A PocketBase instance
 * carries auth state on `authStore`, and modules are shared across concurrent
 * requests on the server — a singleton would leak one user's session into
 * another user's request. Always call this per request.
 */
export async function pbServer(): Promise<PocketBase> {
  const pb = new PocketBase(PB_URL);
  pb.autoCancellation(false);

  const cookieStore = await cookies();
  const raw = cookieStore.get(AUTH_COOKIE)?.value;
  if (raw) {
    // `loadFromCookie` parses a cookie *header*, URI-decoding the value as it
    // goes. Next has already decoded what `get()` returns, so re-encode here —
    // otherwise a payload containing a literal '%' would be mangled.
    pb.authStore.loadFromCookie(`${AUTH_COOKIE}=${encodeURIComponent(raw)}`);
  }
  return pb;
}

/**
 * An instance authenticated as the PocketBase superuser.
 *
 * Bypasses every API rule, so it is only for trusted server-side work that
 * genuinely cannot run as the signed-in user: seeding, migrations, and reading
 * collections no role may list. Never use it to serve an ordinary user request.
 */
export async function pbAdmin(): Promise<PocketBase> {
  const email = process.env.PB_ADMIN_EMAIL;
  const password = process.env.PB_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD must be set for superuser access.');
  }
  const pb = new PocketBase(PB_URL);
  pb.autoCancellation(false);
  await pb.collection('_superusers').authWithPassword(email, password);
  return pb;
}

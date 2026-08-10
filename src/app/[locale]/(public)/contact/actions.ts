'use server';

import PocketBase from 'pocketbase';
import { PB_URL } from '@/lib/pb/server';
import { looksAutomated, validateContact, type ContactErrors } from '@/lib/public/contact';

export type ContactState = {
  status: 'idle' | 'sent' | 'error';
  errors?: ContactErrors;
  /** Echoed back so a failed submission does not empty the form. */
  values?: Record<string, string>;
};

/**
 * Receive a contact message.
 *
 * The only public write in the portal. It runs anonymously — `contact` has a
 * create-only rule for visitors, so this needs no credentials and must not use
 * any: a superuser client here would bypass the very rule that limits what the
 * public can do.
 *
 * Every field is re-validated here regardless of what the browser checked. This
 * is a public endpoint and a form post can be crafted by hand.
 */
export async function submitContact(
  _previous: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const raw = Object.fromEntries(formData.entries()) as Record<string, string>;
  // Echoed back on failure, minus the honeypot.
  const values = Object.fromEntries(
    Object.entries(raw).filter(([key]) => key !== 'website'),
  ) as Record<string, string>;

  // A bot that fills the honeypot is told the message was sent. Telling it the
  // truth would only teach it to stop filling the field.
  if (looksAutomated(raw)) return { status: 'sent' };

  const result = validateContact(raw);
  if (!result.ok) return { status: 'error', errors: result.errors, values };

  try {
    const pb = new PocketBase(PB_URL);
    pb.autoCancellation(false);

    // `ip_address` and `user_agent` are deliberately NOT sent.
    //
    // Both are marked hidden in the schema, and PocketBase strips hidden fields
    // from a create it does not trust — verified against the live instance: an
    // anonymous create supplying them stores empty strings. Sending them anyway
    // would be code that looks like it captures spam-triage data and silently
    // does not.
    //
    // The only way to populate them would be a superuser client here, which is
    // exactly what must not happen: this endpoint runs on behalf of an
    // anonymous visitor, and the create-only API rule is what limits what the
    // public can do. If staff need this data, either unhide the fields in the
    // schema or capture it at the edge — not by escalating this request.
    await pb.collection('contact').create({ ...result.data, status: 'new' });

    return { status: 'sent' };
  } catch {
    // The message is worth more than the diagnosis: never surface a PocketBase
    // error to a citizen, and never lose what they typed.
    return { status: 'error', values };
  }
}

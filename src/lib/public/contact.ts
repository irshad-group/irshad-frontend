import { z } from 'zod';

/**
 * What a visitor may send through the contact form.
 *
 * Field lengths mirror the PocketBase schema exactly (`first_name` and
 * `last_name` 64, `phone` 32, `message` 4000). Validating here as well as there
 * is not redundant: PocketBase would reject an over-long value with an English
 * API error, whereas this produces a message in the visitor's own language
 * before anything is sent.
 *
 * This runs on the server inside a Server Action. The browser's own `required`
 * attributes are a convenience for people who have JavaScript; they are not the
 * check, because a form post can be crafted by hand.
 */
export const contactSchema = z.object({
  first_name: z.string().trim().min(1).max(64),
  last_name: z.string().trim().min(1).max(64),
  email: z.string().trim().min(1).max(255).email(),
  // Optional in the schema, so an empty string is normalised away rather than
  // stored as a blank the staff inbox would render as a broken tel: link.
  phone: z
    .string()
    .trim()
    .max(32)
    .optional()
    .transform((value) => (value ? value : undefined)),
  message: z.string().trim().min(10).max(4000),
  /**
   * Honeypot. Hidden from people, irresistible to naive bots. A submission that
   * fills it is accepted by the form and silently discarded, so the bot gets no
   * signal about why it failed.
   */
  website: z.string().max(0).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

export type ContactErrors = Partial<Record<keyof ContactInput, string>>;

/**
 * Validate raw form data.
 *
 * Returns field-keyed error codes rather than sentences: the caller looks them
 * up in the message catalogue, so the same validation serves all three
 * languages and no English leaks into an Arabic page.
 */
export function validateContact(
  form: Record<string, unknown>,
): { ok: true; data: ContactInput } | { ok: false; errors: ContactErrors } {
  const result = contactSchema.safeParse(form);
  if (result.success) return { ok: true, data: result.data };

  const errors: ContactErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && !(field in errors)) {
      errors[field as keyof ContactInput] = codeFor(issue.code, field);
    }
  }
  return { ok: false, errors };
}

function codeFor(code: string, field: string): string {
  if (field === 'email' && code === 'invalid_format') return 'invalidEmail';
  if (code === 'too_small') return 'tooShort';
  if (code === 'too_big') return 'tooLong';
  return 'invalid';
}

/** Did the honeypot catch something? Checked separately — it is not a user error. */
export function looksAutomated(form: Record<string, unknown>): boolean {
  const trap = form.website;
  return typeof trap === 'string' && trap.trim().length > 0;
}

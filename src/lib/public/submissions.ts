import { z } from 'zod';

/**
 * What a signed-in citizen may send through the procedure-submission wizard.
 *
 * Steps and documents arrive as one textarea each — "one per line" — because
 * that survives without JavaScript and is the least ceremony for someone
 * typing on a phone. They are parsed into arrays here, stored as JSON on
 * `procedure_submissions`, and reviewed by staff before anything reaches the
 * public `procedures` collection. Ministries and directorates are picked from
 * what exists; nothing here can create one.
 *
 * Validation returns field-keyed error CODES, not sentences — the caller
 * renders them from the message catalogue in the visitor's own language.
 */

export const MAX_LINES = 30;
export const MAX_LINE_LENGTH = 300;
export const MAX_FEE = 100_000_000;

/** PocketBase relation ids are 15 chars; anything else cannot be a valid pick. */
const relationId = z
  .string()
  .trim()
  .regex(/^[a-z0-9]{15}$/i)
  .optional()
  .or(z.literal('').transform(() => undefined));

const rawSchema = z.object({
  title: z.string().trim().min(5).max(200),
  summary: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v ? v : undefined)),
  ministry: relationId,
  directorate: relationId,
  steps: z.string().max(MAX_LINES * (MAX_LINE_LENGTH + 2)),
  documents: z
    .string()
    .max(MAX_LINES * (MAX_LINE_LENGTH + 2))
    .optional()
    .default(''),
  fee_iqd: z.string().trim().optional().default(''),
  processing_time: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v ? v : undefined)),
  notes: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => (v ? v : undefined)),
  /** Honeypot — same contract as the contact form. */
  website: z.string().max(0).optional(),
});

export type SubmissionData = {
  title: string;
  summary?: string;
  ministry?: string;
  directorate?: string;
  steps: string[];
  documents: string[];
  fee_iqd?: number;
  processing_time?: string;
  notes?: string;
};

export type SubmissionErrors = Partial<
  Record<'title' | 'summary' | 'ministry' | 'directorate' | 'steps' | 'documents' | 'fee_iqd' | 'processing_time' | 'notes', string>
>;

/** One entry per non-empty line, trimmed. */
export function splitLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function lineErrors(lines: string[], required: boolean): string | null {
  if (required && lines.length === 0) return 'tooShort';
  if (lines.length > MAX_LINES) return 'tooLong';
  if (lines.some((line) => line.length > MAX_LINE_LENGTH)) return 'tooLong';
  return null;
}

function codeFor(code: string): string {
  if (code === 'too_small') return 'tooShort';
  if (code === 'too_big') return 'tooLong';
  return 'invalid';
}

export function validateSubmission(
  form: Record<string, unknown>,
): { ok: true; data: SubmissionData } | { ok: false; errors: SubmissionErrors } {
  const parsed = rawSchema.safeParse(form);

  // Both validation phases always run, so one report carries every field's
  // problem — a wizard that reveals errors one submission at a time teaches
  // people to distrust the form.
  const errors: SubmissionErrors = {};
  if (!parsed.success) {
    // Reversed so the FIRST issue per field wins by overwriting — the schema
    // is flat, so every issue path is a single field name.
    for (const issue of [...parsed.error.issues].reverse()) {
      errors[String(issue.path[0]) as keyof SubmissionErrors] = codeFor(issue.code);
    }
  }

  const steps = splitLines(typeof form.steps === 'string' ? form.steps : '');
  if (!errors.steps) {
    const stepsError = lineErrors(steps, true);
    if (stepsError) errors.steps = stepsError;
  }

  const documents = splitLines(typeof form.documents === 'string' ? form.documents : '');
  if (!errors.documents) {
    const documentsError = lineErrors(documents, false);
    if (documentsError) errors.documents = documentsError;
  }

  let fee: number | undefined;
  const feeRaw = typeof form.fee_iqd === 'string' ? form.fee_iqd.trim() : '';
  if (feeRaw !== '') {
    const value = Number(feeRaw);
    if (!Number.isInteger(value) || value < 0 || value > MAX_FEE) {
      errors.fee_iqd = 'invalid';
    } else {
      fee = value;
    }
  }

  // Every zod issue keys a field above, so a parse failure always leaves at
  // least one code; the split return exists for type narrowing.
  if (!parsed.success) return { ok: false, errors };
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      title: parsed.data.title,
      summary: parsed.data.summary,
      ministry: parsed.data.ministry,
      directorate: parsed.data.directorate,
      steps,
      documents,
      fee_iqd: fee,
      processing_time: parsed.data.processing_time,
      notes: parsed.data.notes,
    },
  };
}

/** Did the honeypot catch something? Not a user error — checked separately. */
export function submissionLooksAutomated(form: Record<string, unknown>): boolean {
  const trap = form.website;
  return typeof trap === 'string' && trap.trim().length > 0;
}

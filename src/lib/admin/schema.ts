import { z } from 'zod';
import type { CollectionDef, FieldDef } from './registry';
import { storedFieldNames } from './registry';

/**
 * Builds a Zod schema for a collection straight from the registry, so the form,
 * the validation and the PocketBase payload can never drift apart.
 *
 * Everything arrives from an HTML form as a string, so this is also where
 * coercion happens. Nothing here is a substitute for the collection's API
 * rules — a hostile client can skip this entirely by calling PocketBase
 * directly, which is exactly why the rules exist.
 */

const emptyToUndefined = (v: unknown) => (v === '' || v == null ? undefined : v);

function scalarSchema(field: FieldDef, required: boolean): z.ZodTypeAny {
  switch (field.kind) {
    case 'number': {
      let n = z.coerce.number();
      if (field.min !== undefined) n = n.min(field.min, `Must be at least ${field.min}.`);
      if (field.max !== undefined) n = n.max(field.max, `Must be at most ${field.max}.`);
      return required ? n : z.preprocess(emptyToUndefined, n.optional());
    }
    case 'bool':
      // Unchecked checkboxes are simply absent from FormData.
      return z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean());
    case 'email': {
      const e = z.email('Enter a valid email address.');
      return required ? e : z.preprocess(emptyToUndefined, e.optional());
    }
    case 'url': {
      const u = z.url('Enter a valid URL, including https://');
      return required ? u : z.preprocess(emptyToUndefined, u.optional());
    }
    case 'select': {
      const values = (field.options ?? []) as [string, ...string[]];
      if (!values.length) return z.string();
      const e = z.enum(values);
      return required ? e : z.preprocess(emptyToUndefined, e.optional());
    }
    case 'relation': {
      if (field.relation?.multiple) return z.array(z.string()).default([]);
      const s = z.string();
      return required ? s.min(1, 'Select a value.') : s.optional().default('');
    }
    case 'date':
      return z.string().optional().default('');
    default: {
      const s = z.string();
      return required ? s.trim().min(1, 'This field is required.') : s.optional().default('');
    }
  }
}

export function buildSchema(def: CollectionDef): z.ZodType<Record<string, unknown>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of def.fields) {
    if (field.kind === 'file') continue; // Files are handled outside Zod.

    if (field.translatable) {
      for (const stored of storedFieldNames(field)) {
        // Only English is enforced as required. Content is translated over time,
        // and blocking a save on a missing Kurdish string would just push
        // editors to paste placeholder text.
        const isEnglish = stored.endsWith('_en');
        shape[stored] = scalarSchema(field, !!field.required && isEnglish);
      }
      continue;
    }
    shape[field.name] = scalarSchema(field, !!field.required);
  }

  return z.object(shape);
}

export type ParseResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; errors: Record<string, string> };

/** Extracts and validates the non-file fields of a submitted form. */
export function parseForm(def: CollectionDef, formData: FormData): ParseResult {
  const raw: Record<string, unknown> = {};

  for (const field of def.fields) {
    if (field.kind === 'file') continue;

    if (field.relation?.multiple) {
      raw[field.name] = formData.getAll(field.name).map(String).filter(Boolean);
      continue;
    }
    for (const stored of storedFieldNames(field)) {
      const value = formData.get(stored);
      if (value !== null) raw[stored] = value;
      else if (field.kind === 'bool') raw[stored] = false;
    }
  }

  const result = buildSchema(def).safeParse(raw);
  if (result.success) return { ok: true, data: result.data as Record<string, unknown> };

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.');
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
}

/**
 * `comments`, `reviews` and `files` replace the legacy dest_type/dest_id pair
 * with separate nullable relations, of which exactly one may be set. PocketBase
 * has no CHECK constraint for that, so it is enforced here.
 */
const POLYMORPHIC_TARGETS: Partial<Record<string, readonly string[]>> = {
  comments: ['procedure', 'procedure_item', 'directorate', 'ministry'],
  reviews: ['procedure', 'procedure_item', 'directorate', 'ministry'],
  files: ['procedure', 'procedure_item'],
};

export function checkSingleTarget(
  collection: string,
  data: Record<string, unknown>,
): string | null {
  const targets = POLYMORPHIC_TARGETS[collection];
  if (!targets) return null;

  // Only validate the targets the form actually submitted, so a partial edit
  // (the moderation form, which posts only `approved`) is not rejected.
  const present = targets.filter((t) => t in data);
  if (!present.length) return null;

  const set = present.filter((t) => {
    const value = data[t];
    return typeof value === 'string' && value.length > 0;
  });
  if (set.length > 1) {
    return `Attach this record to only one of: ${targets.join(', ')}.`;
  }
  return null;
}

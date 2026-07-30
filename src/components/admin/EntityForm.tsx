'use client';

import { useActionState, useState } from 'react';
import type { ActionState } from '@/lib/admin/actions';
import type { FieldDef } from '@/lib/admin/registry';
import { Alert, buttonClass, cn, inputClass } from '@/components/ui/primitives';

export type RelationOption = { id: string; label: string };

export type FormFieldDef = FieldDef & { storedNames: string[] };

const INITIAL: ActionState = { ok: false };

const LOCALE_TABS = [
  { suffix: 'en', label: 'English', dir: 'ltr' as const },
  { suffix: 'ar', label: 'العربية', dir: 'rtl' as const },
  { suffix: 'ku', label: 'کوردی', dir: 'rtl' as const },
];

/**
 * Every input here is controlled.
 *
 * React 19 resets an uncontrolled form once its action resolves, which would
 * throw away everything the editor typed whenever validation failed — on a
 * long rich-text description that is a serious loss. Holding the values in
 * state keeps them across a rejected submit.
 */
type Values = Record<string, unknown>;

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-ink-700">
      {children}
      {required ? <span className="ms-0.5 text-red-600">*</span> : null}
    </label>
  );
}

function ScalarInput({
  field,
  name,
  value,
  onChange,
  dir,
  relationOptions,
  error,
}: {
  field: FieldDef;
  name: string;
  value: unknown;
  onChange: (next: unknown) => void;
  dir?: 'ltr' | 'rtl';
  relationOptions?: RelationOption[];
  error?: string;
}) {
  const text = value === undefined || value === null ? '' : String(value);
  const shared = {
    id: name,
    name,
    dir,
    'aria-invalid': error ? true : undefined,
    className: cn(inputClass, error && 'ring-red-400'),
  };

  switch (field.kind) {
    case 'textarea':
      return (
        <textarea {...shared} rows={3} value={text} onChange={(e) => onChange(e.target.value)} />
      );
    case 'editor':
      return (
        <textarea
          {...shared}
          rows={8}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          className={cn(shared.className, 'font-mono text-xs')}
        />
      );
    case 'bool':
      return (
        <label className="inline-flex items-center gap-2">
          <input
            id={name}
            name={name}
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            className="size-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm text-ink-600">{field.label}</span>
        </label>
      );
    case 'number':
      return (
        <input
          {...shared}
          type="number"
          min={field.min}
          max={field.max}
          value={text}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'email':
      return (
        <input {...shared} type="email" value={text} onChange={(e) => onChange(e.target.value)} />
      );
    case 'url':
      return (
        <input {...shared} type="url" value={text} onChange={(e) => onChange(e.target.value)} />
      );
    case 'date':
      return (
        <input
          {...shared}
          type="date"
          value={text.slice(0, 10)}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'select':
      return (
        <select {...shared} value={text} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      );
    case 'relation': {
      const options = relationOptions ?? [];
      if (field.relation?.multiple) {
        const selected = Array.isArray(value) ? value.map(String) : [];
        return (
          <select
            {...shared}
            multiple
            size={Math.min(8, Math.max(4, options.length))}
            value={selected}
            onChange={(e) =>
              onChange(Array.from(e.target.selectedOptions).map((option) => option.value))
            }
          >
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        );
      }
      return (
        <select {...shared} value={text} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }
    case 'file':
      // File inputs cannot be controlled; they are read straight off the FormData.
      return <input id={name} name={name} type="file" accept={field.accept} className="text-sm" />;
    default:
      return (
        <input {...shared} type="text" value={text} onChange={(e) => onChange(e.target.value)} />
      );
  }
}

/**
 * Translatable fields render all three languages together rather than behind a
 * language switcher, so an editor can see at a glance which are still empty —
 * content is routinely only partly translated and the gap should be visible.
 */
function TranslatableGroup({
  field,
  values,
  setValue,
  errors,
}: {
  field: FormFieldDef;
  values: Values;
  setValue: (name: string, next: unknown) => void;
  errors: Record<string, string>;
}) {
  return (
    <fieldset className="rounded-md border border-ink-200 p-3">
      <legend className="px-1 text-sm font-medium text-ink-700">
        {field.label}
        {field.required ? <span className="ms-0.5 text-red-600">*</span> : null}
      </legend>

      <div className="grid gap-3 md:grid-cols-3">
        {LOCALE_TABS.map((tab) => {
          const name = `${field.name}_${tab.suffix}`;
          const value = values[name];
          const empty = !String(value ?? '').trim();
          return (
            <div key={name}>
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor={name} className="text-xs font-medium text-ink-500">
                  {tab.label}
                </label>
                {empty ? <span className="text-xs font-medium text-amber-600">empty</span> : null}
              </div>
              <ScalarInput
                field={field}
                name={name}
                value={value}
                onChange={(next) => setValue(name, next)}
                dir={tab.dir}
                error={errors[name]}
              />
              {errors[name] ? <p className="mt-1 text-xs text-red-600">{errors[name]}</p> : null}
            </div>
          );
        })}
      </div>
      {field.help ? <p className="mt-2 text-xs text-ink-500">{field.help}</p> : null}
    </fieldset>
  );
}

export default function EntityForm({
  action,
  fields,
  values: initialValues,
  relationOptions,
  fileValues,
  labels,
  cancelHref,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  fields: FormFieldDef[];
  values: Values;
  relationOptions: Record<string, RelationOption[]>;
  fileValues: Record<string, string>;
  labels: {
    save: string;
    saving: string;
    cancel: string;
    currentFile: string;
    clearFile: string;
    hint: string;
  };
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const [values, setValues] = useState<Values>(initialValues);
  const errors = state.errors ?? {};

  const setValue = (name: string, next: unknown) =>
    setValues((prev) => ({ ...prev, [name]: next }));

  return (
    <form action={formAction} className="space-y-5">
      {state.message ? <Alert tone={state.ok ? 'success' : 'error'}>{state.message}</Alert> : null}

      {fields.map((field) => {
        if (field.translatable) {
          return (
            <TranslatableGroup
              key={field.name}
              field={field}
              values={values}
              setValue={setValue}
              errors={errors}
            />
          );
        }

        if (field.kind === 'bool') {
          return (
            <div key={field.name}>
              <ScalarInput
                field={field}
                name={field.name}
                value={values[field.name]}
                onChange={(next) => setValue(field.name, next)}
              />
              {field.help ? <p className="mt-1 text-xs text-ink-500">{field.help}</p> : null}
            </div>
          );
        }

        return (
          <div key={field.name}>
            <FieldLabel htmlFor={field.name} required={field.required}>
              {field.label}
            </FieldLabel>

            {field.kind === 'file' && fileValues[field.name] ? (
              <p className="mb-1 text-xs text-ink-500">
                {labels.currentFile}: <span className="font-mono">{fileValues[field.name]}</span>
              </p>
            ) : null}

            <ScalarInput
              field={field}
              name={field.name}
              value={values[field.name]}
              onChange={(next) => setValue(field.name, next)}
              relationOptions={relationOptions[field.name]}
              error={errors[field.name]}
            />

            {field.kind === 'file' && fileValues[field.name] ? (
              <label className="mt-1.5 inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  name={`${field.name}__clear`}
                  className="size-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs text-ink-600">{labels.clearFile}</span>
              </label>
            ) : null}

            {errors[field.name] ? (
              <p className="mt-1 text-xs text-red-600">{errors[field.name]}</p>
            ) : null}
            {field.help ? <p className="mt-1 text-xs text-ink-500">{field.help}</p> : null}
          </div>
        );
      })}

      <div className="flex items-center gap-3 border-t border-ink-200 pt-4">
        <button type="submit" disabled={pending} className={buttonClass('primary')}>
          {pending ? labels.saving : labels.save}
        </button>
        <a href={cancelHref} className={buttonClass('secondary')}>
          {labels.cancel}
        </a>
        <span className="text-xs text-ink-400">{labels.hint}</span>
      </div>
    </form>
  );
}

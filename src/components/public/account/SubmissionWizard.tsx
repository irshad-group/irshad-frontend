'use client';

import { useActionState, useRef, useState, useSyncExternalStore } from 'react';
import {
  submitProcedure,
  type SubmissionState,
} from '@/app/[locale]/(public)/account/actions';

/**
 * The procedure-suggestion wizard.
 *
 * ONE form, three visual parts. The parts are hidden and revealed by client
 * state; without JavaScript nothing is ever hidden, so the same markup is a
 * single long form that submits normally — the wizard is presentation, not
 * structure. Inputs are uncontrolled and stay mounted throughout, so values
 * survive moving back and forth between parts.
 */

export type WizardOption = { id: string; label: string; ministry?: string };

export type WizardLabels = {
  stepLabel: string;
  stepTitles: [string, string, string];
  titleLabel: string;
  titleHint: string;
  summaryLabel: string;
  ministryLabel: string;
  ministryHint: string;
  directorateLabel: string;
  directorateHint: string;
  stepsLabel: string;
  stepsHint: string;
  documentsLabel: string;
  documentsHint: string;
  feeLabel: string;
  feeHint: string;
  timeLabel: string;
  timeHint: string;
  notesLabel: string;
  next: string;
  back: string;
  send: string;
  none: string;
  errors: Record<string, string>;
};

const IDLE: SubmissionState = { status: 'idle' };

/** Which part each server-validated field lives in, for jumping to errors. */
const FIELD_PART: Record<string, number> = {
  title: 0,
  summary: 0,
  ministry: 0,
  directorate: 0,
  steps: 1,
  documents: 1,
  fee_iqd: 1,
  processing_time: 1,
  notes: 2,
};

const inputClass =
  'block w-full border border-ink-300 bg-white px-3 py-2.5 text-sm text-ink-950 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30';
const labelClass = 'mb-1 block text-sm font-semibold text-ink-700';
const hintClass = 'mt-1 text-xs text-ink-500';

const subscribeNever = () => () => {};

export default function SubmissionWizard({
  ministries,
  directorates,
  labels,
}: {
  ministries: WizardOption[];
  directorates: WizardOption[];
  labels: WizardLabels;
}) {
  const [state, action, pending] = useActionState(submitProcedure, IDLE);
  // `mounted` gates ALL hiding: false on the server and until hydration (or
  // forever, without JS), so every part is visible and the form is one long
  // page. `useSyncExternalStore` is the render-safe "has hydrated" signal.
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
  const [part, setPart] = useState(0);
  const [ministry, setMinistry] = useState('');
  const topRef = useRef<HTMLDivElement | null>(null);

  // After a failed server validation, land on the first part with a problem —
  // adjusted during render (the documented pattern) rather than in an effect.
  const [seenState, setSeenState] = useState<SubmissionState>(state);
  if (state !== seenState) {
    setSeenState(state);
    if (state.status === 'error' && state.errors) {
      const parts = Object.keys(state.errors)
        .map((field) => FIELD_PART[field])
        .filter((n): n is number => n !== undefined);
      if (parts.length) setPart(Math.min(...parts));
    }
  }

  const visible = (index: number) => !mounted || part === index;
  const go = (index: number) => {
    setPart(Math.max(0, Math.min(2, index)));
    topRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  const offices = ministry
    ? directorates.filter((d) => !d.ministry || d.ministry === ministry)
    : directorates;

  const err = (field: string) =>
    state.errors?.[field as keyof typeof state.errors] ? (
      <p role="alert" className="mt-1 text-xs text-red-700">
        {labels.errors[String(state.errors[field as keyof typeof state.errors])] ??
          labels.errors.invalid}
      </p>
    ) : null;

  return (
    <div ref={topRef}>
      {/* Progress — meaningful only when the wizard behaviour is active. */}
      {mounted ? (
        <ol className="mb-6 flex gap-1.5" aria-hidden="true">
          {labels.stepTitles.map((title, index) => (
            <li key={title} className="flex-1">
              <button
                type="button"
                onClick={() => go(index)}
                className="block w-full text-start"
              >
                <span
                  className={`block h-1 ${index <= part ? 'bg-brand-500' : 'bg-ink-200'}`}
                />
                <span
                  className={`mt-1.5 block text-xs font-bold ${index === part ? 'text-ink-950' : 'text-ink-400'}`}
                >
                  {labels.stepLabel.replace('{n}', String(index + 1)).replace('{total}', '3')}
                </span>
              </button>
            </li>
          ))}
        </ol>
      ) : null}

      {state.errors?.form ? (
        <p role="alert" className="mb-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {labels.errors[state.errors.form] ?? labels.errors.invalid}
        </p>
      ) : null}

      <form action={action} className="space-y-8">
        {/* Honeypot — matches the contact form's contract. */}
        <div aria-hidden="true" className="absolute -start-[9999px] h-px w-px overflow-hidden">
          <label>
            website
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <fieldset hidden={!visible(0)} className="space-y-4">
          <legend className="mb-2 text-lg font-extrabold text-ink-950">
            {labels.stepTitles[0]}
          </legend>
          <div>
            <label htmlFor="sub-title" className={labelClass}>
              {labels.titleLabel}
            </label>
            <input
              id="sub-title"
              name="title"
              required
              minLength={5}
              maxLength={200}
              placeholder={labels.titleHint}
              defaultValue={state.values?.title ?? ''}
              className={inputClass}
            />
            {err('title')}
          </div>
          <div>
            <label htmlFor="sub-summary" className={labelClass}>
              {labels.summaryLabel}
            </label>
            <textarea
              id="sub-summary"
              name="summary"
              rows={2}
              maxLength={500}
              defaultValue={state.values?.summary ?? ''}
              className={inputClass}
            />
            {err('summary')}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="sub-ministry" className={labelClass}>
                {labels.ministryLabel}
              </label>
              <select
                id="sub-ministry"
                name="ministry"
                defaultValue={state.values?.ministry ?? ''}
                onChange={(event) => setMinistry(event.target.value)}
                className={inputClass}
              >
                <option value="">{labels.none}</option>
                {ministries.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className={hintClass}>{labels.ministryHint}</p>
            </div>
            <div>
              <label htmlFor="sub-directorate" className={labelClass}>
                {labels.directorateLabel}
              </label>
              <select
                id="sub-directorate"
                name="directorate"
                defaultValue={state.values?.directorate ?? ''}
                className={inputClass}
              >
                <option value="">{labels.none}</option>
                {offices.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className={hintClass}>{labels.directorateHint}</p>
            </div>
          </div>
          {mounted && part === 0 ? (
            <WizardNav onNext={() => go(1)} nextLabel={labels.next} />
          ) : null}
        </fieldset>

        <fieldset hidden={!visible(1)} className="space-y-4">
          <legend className="mb-2 text-lg font-extrabold text-ink-950">
            {labels.stepTitles[1]}
          </legend>
          <div>
            <label htmlFor="sub-steps" className={labelClass}>
              {labels.stepsLabel}
            </label>
            <textarea
              id="sub-steps"
              name="steps"
              rows={6}
              required
              placeholder={labels.stepsHint}
              defaultValue={state.values?.steps ?? ''}
              className={inputClass}
            />
            <p className={hintClass}>{labels.stepsHint}</p>
            {err('steps')}
          </div>
          <div>
            <label htmlFor="sub-documents" className={labelClass}>
              {labels.documentsLabel}
            </label>
            <textarea
              id="sub-documents"
              name="documents"
              rows={4}
              placeholder={labels.documentsHint}
              defaultValue={state.values?.documents ?? ''}
              className={inputClass}
            />
            <p className={hintClass}>{labels.documentsHint}</p>
            {err('documents')}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="sub-fee" className={labelClass}>
                {labels.feeLabel}
              </label>
              <input
                id="sub-fee"
                name="fee_iqd"
                inputMode="numeric"
                pattern="[0-9]*"
                defaultValue={state.values?.fee_iqd ?? ''}
                className={inputClass}
                dir="ltr"
              />
              <p className={hintClass}>{labels.feeHint}</p>
              {err('fee_iqd')}
            </div>
            <div>
              <label htmlFor="sub-time" className={labelClass}>
                {labels.timeLabel}
              </label>
              <input
                id="sub-time"
                name="processing_time"
                maxLength={120}
                placeholder={labels.timeHint}
                defaultValue={state.values?.processing_time ?? ''}
                className={inputClass}
              />
              {err('processing_time')}
            </div>
          </div>
          {mounted && part === 1 ? (
            <WizardNav onBack={() => go(0)} onNext={() => go(2)} backLabel={labels.back} nextLabel={labels.next} />
          ) : null}
        </fieldset>

        <fieldset hidden={!visible(2)} className="space-y-4">
          <legend className="mb-2 text-lg font-extrabold text-ink-950">
            {labels.stepTitles[2]}
          </legend>
          <div>
            <label htmlFor="sub-notes" className={labelClass}>
              {labels.notesLabel}
            </label>
            <textarea
              id="sub-notes"
              name="notes"
              rows={3}
              maxLength={1000}
              defaultValue={state.values?.notes ?? ''}
              className={inputClass}
            />
            {err('notes')}
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {mounted ? (
              <button
                type="button"
                onClick={() => go(1)}
                className="border border-ink-300 px-5 py-3 text-sm font-bold text-ink-700 transition-colors hover:border-ink-950"
              >
                {labels.back}
              </button>
            ) : null}
            <button
              type="submit"
              disabled={pending}
              className="bg-brand-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-500/60"
            >
              {labels.send}
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}

function WizardNav({
  onBack,
  onNext,
  backLabel,
  nextLabel,
}: {
  onBack?: () => void;
  onNext: () => void;
  backLabel?: string;
  nextLabel: string;
}) {
  return (
    <div className="flex items-center gap-3 pt-2">
      {onBack && backLabel ? (
        <button
          type="button"
          onClick={onBack}
          className="border border-ink-300 px-5 py-3 text-sm font-bold text-ink-700 transition-colors hover:border-ink-950"
        >
          {backLabel}
        </button>
      ) : null}
      <button
        type="button"
        onClick={onNext}
        className="bg-ink-950 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-500"
      >
        {nextLabel}
      </button>
    </div>
  );
}
